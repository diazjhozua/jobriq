import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE_SRC = path.join(__dirname, '../../templates/resume-template.txt')
const RESUMES_DIR = 'resumes'
const OUTPUT_NAME = 'my-resume.txt'

export async function initCommand(): Promise<void> {
  const dir = path.join(process.cwd(), RESUMES_DIR)
  const dest = path.join(dir, OUTPUT_NAME)

  if (fs.existsSync(dest)) {
    console.log(chalk.yellow(`⚠  ${RESUMES_DIR}/${OUTPUT_NAME} already exists.`))
    console.log(chalk.dim('   Delete or rename it first, then run jobriq init again.'))
    process.exit(1)
  }

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.copyFileSync(TEMPLATE_SRC, dest)
  console.log(chalk.green(`✔ Created ${RESUMES_DIR}/${OUTPUT_NAME}`))
  console.log()
  console.log('  Open it in any text editor, fill in your details, then run:')
  console.log(chalk.cyan(`  jobriq build ${RESUMES_DIR}/${OUTPUT_NAME}`))
}
