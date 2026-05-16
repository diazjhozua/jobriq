import fs from 'fs'
import readline from 'readline'
import chalk from 'chalk'
import ora from 'ora'
import { applyFeedback } from './ai/apply-feedback.js'
import { generateSuggestions } from './ai/generate-suggestions.js'
import { writeSuggestionsBlock } from './parser/template.js'
import type { SessionState, Resume } from './types/resume.js'

export async function runSession(
  initialState: SessionState,
  raw: string,
  templatePath: string
): Promise<SessionState> {
  let state = initialState

  // ── Feedback loop ──────────────────────────────────────────────────────────
  while (true) {
    const input = await prompt(
      chalk.cyan('\nWhat would you like to change?') +
        chalk.dim(' (or type "done" to export)\n') +
        chalk.bold('> ')
    )

    if (input.toLowerCase() === 'done' || input.toLowerCase() === 'exit') break
    if (!input.trim()) continue

    const prev = state
    const spinner = ora('Applying changes...').start()

    try {
      state = await applyFeedback(state, input)
      spinner.succeed(chalk.green('Changes applied'))
    } catch (err) {
      spinner.fail('Failed to apply changes')
      const msg = err instanceof Error ? err.message : String(err)
      console.error(chalk.red(`  ${msg}`))
      continue
    }

    displayChanges(prev, state)
  }

  // ── Generate suggestions ───────────────────────────────────────────────────
  console.log()
  const spinner = ora('Generating improvement suggestions...').start()

  try {
    state.suggestions = await generateSuggestions(state.resume, state.keywordResult)
    spinner.succeed(chalk.green('Suggestions ready'))
  } catch {
    spinner.warn('Could not generate suggestions — continuing without them')
  }

  // ── Display suggestions ────────────────────────────────────────────────────
  if (state.suggestions.length > 0) {
    const divider = chalk.dim('─'.repeat(56))
    console.log()
    console.log(divider)
    console.log(chalk.bold('  AI Suggestions (saved to your template)'))
    console.log()
    state.suggestions.forEach((s, i) => {
      console.log(`  ${chalk.yellow(String(i + 1) + '.')} ${s}`)
    })
    console.log()
  }

  // ── Write suggestions back to template ────────────────────────────────────
  try {
    const updatedRaw = writeSuggestionsBlock(raw, state.suggestions)
    fs.writeFileSync(templatePath, updatedRaw, 'utf-8')
    console.log(
      chalk.dim(`→ Suggestions written to ${templatePath.split(/[\\/]/).pop()}`) +
        chalk.dim('  Edit and re-run "jobriq build" to improve further.')
    )
  } catch {
    console.error(chalk.yellow('⚠  Could not write suggestions back to template.'))
  }

  return state
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function displayChanges(prev: SessionState, next: SessionState): void {
  const divider = chalk.dim('─'.repeat(56))
  let hasChanges = false

  // Summary changed?
  if (prev.resume.summary !== next.resume.summary && next.resume.summary) {
    if (!hasChanges) console.log()
    hasChanges = true
    console.log(divider)
    console.log(chalk.bold('  Updated Summary'))
    console.log()
    for (const line of next.resume.summary.split('\n')) {
      console.log(`  ${line}`)
    }
    console.log()
  }

  // Bullets changed?
  for (const exp of next.resume.experience) {
    const prevExp = prev.resume.experience.find((e) => e.id === exp.id)
    const prevBullets = prevExp?.enhancedBullets?.map((b) => b.enhanced) ?? prevExp?.bullets ?? []
    const nextBullets = exp.enhancedBullets?.map((b) => b.enhanced) ?? exp.bullets

    const changed = nextBullets.some((b, i) => b !== prevBullets[i])
    if (!changed) continue

    if (!hasChanges) console.log()
    hasChanges = true
    console.log(divider)
    console.log(chalk.bold(`  Updated — ${exp.title} at ${exp.company}`))
    console.log()
    for (const b of exp.enhancedBullets ?? []) {
      console.log(chalk.white(`  - ${b.enhanced}`))
      if (b.needsQuantification) {
        const placeholder = b.enhanced.match(/\[.+?\]/)?.[0] ?? '[X]'
        console.log(chalk.yellow(`    ⚠  Needs quantification: ${placeholder}`))
      }
    }
    console.log()
  }

  if (!hasChanges) {
    console.log(chalk.dim('  (No changes detected — try rephrasing your feedback)'))
  }
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

// Exported for use in export step (Phase 5)
export function getActiveBullets(resume: Resume): string[] {
  return resume.experience.flatMap((exp) =>
    exp.enhancedBullets?.map((b) => b.enhanced) ?? exp.bullets
  )
}
