import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { BUILTIN_THEMES } from '../themes/index.js'

const BUILTIN_DESC: Record<string, string> = {
  classic:   'Calibri, neutral grays · centered header',
  modern:    'Calibri, navy accent · left-aligned header',
  minimal:   'Arial, no color · maximum whitespace',
  executive: 'Georgia, dark navy · left-aligned header',
  harvard:   'Times New Roman, all black · bold underlined headers',
}

export function themesCommand(): void {
  console.log()
  console.log(chalk.bold('Built-in designs:'))
  for (const name of Object.keys(BUILTIN_THEMES)) {
    console.log(`  ${chalk.cyan(name.padEnd(10))} ${BUILTIN_DESC[name] ?? ''}`)
  }

  console.log()
  console.log(chalk.bold('Custom (themes/*.json in current directory):'))
  const themesDir = path.join(process.cwd(), 'themes')
  if (!fs.existsSync(themesDir)) {
    console.log(chalk.dim('  (themes/ directory not found — create it to add custom designs)'))
  } else {
    const files = fs.readdirSync(themesDir).filter((f) => f.endsWith('.json'))
    if (files.length === 0) {
      console.log(chalk.dim('  (none found)'))
    } else {
      for (const f of files) {
        console.log(`  ${chalk.yellow(f.replace(/\.json$/, ''))}`)
      }
    }
  }

  console.log()
  console.log(chalk.dim('Usage: jobriq build --design <name>'))
  console.log(chalk.dim('       jobriq build --design modern'))
  console.log()
}
