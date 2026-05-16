import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE_SRC = path.join(__dirname, '../../templates/resume-template.txt')
const OUTPUT_NAME = 'resume-template.txt'

export async function initCommand(): Promise<void> {
  const dest = path.join(process.cwd(), OUTPUT_NAME)

  if (fs.existsSync(dest)) {
    console.log(chalk.yellow(`⚠  ${OUTPUT_NAME} already exists in this directory.`))
    console.log(chalk.dim('   Delete or rename it first, then run jobriq init again.'))
    process.exit(1)
  }

  fs.copyFileSync(TEMPLATE_SRC, dest)
  console.log(chalk.green(`✔ Created ${OUTPUT_NAME}`))
  console.log()
  console.log('  Open it in any text editor, fill in your details, then run:')
  console.log(chalk.cyan(`  jobriq build ${OUTPUT_NAME}`))
}
