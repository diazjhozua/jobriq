import readline from 'readline'
import chalk from 'chalk'
import boxen from 'boxen'
import { getApiKey, setApiKey } from '../config.js'

export async function configCommand(): Promise<void> {
  console.log(
    boxen(chalk.bold('Jobriq — Configuration'), {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    })
  )

  const existing = getApiKey()
  if (existing) {
    const masked = existing.slice(0, 7) + '...' + existing.slice(-4)
    console.log(chalk.dim(`Current key: ${masked}`))
  }

  const label = existing
    ? chalk.cyan('Enter new OpenAI API key (or press Enter to keep current): ')
    : chalk.cyan('Enter your OpenAI API key (starts with sk-): ')

  const key = await prompt(label)

  if (!key && existing) {
    console.log(chalk.green('✔ Keeping existing API key.'))
    return
  }

  if (!key || !key.startsWith('sk-')) {
    console.error(chalk.red('✖ Invalid key — must start with "sk-". Run jobriq config to try again.'))
    process.exit(1)
  }

  setApiKey(key.trim())
  console.log(chalk.green('✔ API key saved.'))
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
