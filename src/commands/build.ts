import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import boxen from 'boxen'
import { parseTemplate } from '../parser/template.js'
import { enhanceBullets } from '../ai/enhance-bullets.js'
import { generateSummary } from '../ai/generate-summary.js'
import { extractKeywords } from '../ai/extract-keywords.js'
import { runSession } from '../session.js'
import type { Resume, KeywordResult, SessionState } from '../types/resume.js'

export async function buildCommand(
  file: string = 'resume-template.txt',
  options: { job?: string }
): Promise<void> {
  // ── 1. Load template ───────────────────────────────────────────────────────
  const templatePath = path.resolve(process.cwd(), file)
  if (!fs.existsSync(templatePath)) {
    console.error(chalk.red(`✖ File not found: ${file}`))
    console.error(chalk.dim('  Run "jobriq init" to create a template.'))
    process.exit(1)
  }

  const raw = fs.readFileSync(templatePath, 'utf-8')
  const resume = parseTemplate(raw)

  // ── 2. Load job description ────────────────────────────────────────────────
  if (options.job) {
    const jdPath = path.resolve(process.cwd(), options.job)
    if (!fs.existsSync(jdPath)) {
      console.error(chalk.red(`✖ Job description file not found: ${options.job}`))
      process.exit(1)
    }
    resume.jobDescription = fs.readFileSync(jdPath, 'utf-8').trim()
  }

  // ── 3. Header ──────────────────────────────────────────────────────────────
  console.log(
    boxen(chalk.bold.cyan('Jobriq — Building your resume...'), {
      padding: { top: 0, bottom: 0, left: 2, right: 2 },
      borderStyle: 'round',
      borderColor: 'cyan',
    })
  )
  console.log()

  const totalBullets = resume.experience.reduce((n, e) => n + e.bullets.length, 0)
  const parts = [
    `${resume.experience.length} job${resume.experience.length !== 1 ? 's' : ''}`,
    `${resume.education.length} education`,
    `${totalBullets} bullet${totalBullets !== 1 ? 's' : ''}`,
  ]
  console.log(chalk.green('✔') + chalk.dim(` Parsed template (${parts.join(', ')})`))

  // ── 4. Enhance bullets ─────────────────────────────────────────────────────
  for (const exp of resume.experience) {
    if (exp.bullets.length === 0) continue
    const spinner = ora(`Enhancing bullets for ${exp.title} at ${exp.company}...`).start()
    try {
      exp.enhancedBullets = await enhanceBullets(exp)
      spinner.succeed(
        chalk.green(`Enhanced ${exp.bullets.length} bullet${exp.bullets.length !== 1 ? 's' : ''} — ${exp.title} at ${exp.company}`)
      )
    } catch (err) {
      spinner.fail(`Failed to enhance bullets for ${exp.company}`)
      handleAiError(err)
      process.exit(1)
    }
  }

  // ── 5. Generate summary ────────────────────────────────────────────────────
  if (!resume.summary && resume.experience.length > 0) {
    const spinner = ora('Generating professional summary...').start()
    try {
      resume.summary = await generateSummary(resume.experience, resume.summaryType)
      spinner.succeed(chalk.green('Summary generated'))
    } catch (err) {
      spinner.fail('Failed to generate summary')
      handleAiError(err)
      process.exit(1)
    }
  }

  // ── 6. ATS keyword extraction ──────────────────────────────────────────────
  let keywordResult: KeywordResult | undefined
  if (resume.jobDescription) {
    const spinner = ora('Extracting ATS keywords from job description...').start()
    try {
      keywordResult = await extractKeywords(resume.jobDescription, resume)
      spinner.succeed(chalk.green('ATS keywords analysed'))
    } catch (err) {
      spinner.fail('Failed to extract keywords')
      handleAiError(err)
      process.exit(1)
    }
  }

  // ── 7. Display results ─────────────────────────────────────────────────────
  console.log()
  displayResults(resume, keywordResult)

  // ── Feedback loop + suggestions (Phase 4) ─────────────────────────────────
  const initialState: SessionState = { resume, keywordResult, suggestions: [] }
  const finalState = await runSession(initialState, raw, templatePath)

  // ── Export (Phase 5) ───────────────────────────────────────────────────────
  console.log()
  console.log(chalk.dim('Export to Markdown + Word coming in Phase 5.'))
}

// ── Display helpers ──────────────────────────────────────────────────────────

function displayResults(resume: Resume, keywordResult?: KeywordResult): void {
  const divider = chalk.dim('─'.repeat(56))

  // Enhanced bullets per experience
  for (const exp of resume.experience) {
    if (!exp.enhancedBullets || exp.enhancedBullets.length === 0) continue

    console.log(divider)
    console.log(chalk.bold(`  ${exp.title} at ${exp.company}`))
    console.log(chalk.dim(`  ${exp.startDate} – ${exp.endDate}`))
    console.log()

    for (const b of exp.enhancedBullets) {
      console.log(chalk.dim(`  Before: "${b.original}"`))
      console.log(chalk.white(`  After:  "${b.enhanced}"`))
      if (b.needsQuantification) {
        const placeholder = b.enhanced.match(/\[.+?\]/)?.[0] ?? '[X]'
        console.log(chalk.yellow(`  ⚠  Needs quantification: ${placeholder}`))
      }
      console.log()
    }
  }

  // Professional summary
  if (resume.summary) {
    console.log(divider)
    console.log(chalk.bold('  Professional Summary'))
    console.log()
    for (const line of resume.summary.split('\n')) {
      console.log(`  ${line}`)
    }
    console.log()
  }

  // ATS keywords
  if (keywordResult) {
    console.log(divider)
    console.log(chalk.bold('  ATS Keywords'))
    console.log()
    if (keywordResult.matched.length > 0) {
      console.log(
        chalk.green(`  ✔ Matched (${keywordResult.matched.length}/20): `) +
          keywordResult.matched.join(', ')
      )
    }
    if (keywordResult.missing.length > 0) {
      console.log(
        chalk.red(`  ✘ Missing (${keywordResult.missing.length}):   `) +
          keywordResult.missing.join(', ')
      )
    }
    console.log()
  }

  // Quantification warnings summary
  const needsQuant = resume.experience.flatMap((exp) =>
    (exp.enhancedBullets ?? []).filter((b) => b.needsQuantification)
  )
  console.log(divider)
  if (needsQuant.length > 0) {
    console.log(
      chalk.yellow(`\n  ⚠  ${needsQuant.length} bullet${needsQuant.length !== 1 ? 's' : ''} need quantification (marked above)\n`)
    )
  } else {
    console.log(chalk.green('\n  ✔ All bullets are quantified\n'))
  }
}

function handleAiError(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('401') || msg.includes('Incorrect API key')) {
    console.error(chalk.red('  Invalid API key. Run: jobriq config'))
  } else if (msg.includes('429')) {
    console.error(chalk.red('  Rate limit exceeded. Wait a moment and try again.'))
  } else {
    console.error(chalk.red(`  Error: ${msg}`))
  }
}
