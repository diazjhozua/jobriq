#!/usr/bin/env node
// PreToolUse guard for Bash commands. Exit 2 blocks the call and reports to Claude.

const BLOCK_MESSAGE = (reason) =>
  `Blocked by .claude/hooks/guard-bash.mjs: ${reason}\n` +
  'Ask the user before retrying; do not work around this guard.'

const SECRET_PATH = /(^|[\s'"])(\.env(?!\.(example|template|sample))|resumes\/|.*\.(pfx|pem|key)\b|appsettings\.[\w.-]*\.local\.json)/i

function readInput() {
  return new Promise((resolve) => {
    let raw = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => (raw += chunk))
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'))
      } catch {
        resolve({})
      }
    })
  })
}

function block(reason) {
  process.stderr.write(BLOCK_MESSAGE(reason) + '\n')
  process.exit(2)
}

const input = await readInput()
const command = String(input?.tool_input?.command ?? '')

if (!command) {
  process.exit(0)
}

if (/git\s+commit[^\n]*--no-verify/.test(command)) {
  block('`git commit --no-verify` skips the project hooks.')
}

if (/git\s+push[^\n]*(\s--force\b|\s-f\b)/.test(command) && /\b(main|master)\b/.test(command)) {
  block('force-pushing to main/master is destructive.')
}

if (/git\s+reset\s+--hard/.test(command)) {
  block('`git reset --hard` discards uncommitted work.')
}

if (/\bgit\b[^\n]*\b(diff|log)\b/.test(command) && /(\s--output(=|\s|$)|\s--ext-diff\b|\s--exec\b|\s-c\s)/.test(command)) {
  block('git diff/log flags can write files or execute external programs.')
}

if (/git\s+add\b[^\n]*/.test(command) && SECRET_PATH.test(command)) {
  block('staging secrets or local resume data.')
}

if (/\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)\b/.test(command)) {
  const targets = command.split(/\s+/).slice(1).filter((token) => !token.startsWith('-'))
  const dangerous = targets.some((target) => {
    const normalized = target.replace(/["']/g, '').replace(/\\/g, '/').replace(/\/+$/, '')
    return (
      normalized === '' ||
      normalized === '/' ||
      normalized === '~' ||
      normalized === '.' ||
      normalized === '..' ||
      /^[a-zA-Z]:$/.test(normalized) ||
      normalized === process.env.CLAUDE_PROJECT_DIR?.replace(/\\/g, '/')
    )
  })

  if (dangerous) {
    block('recursive delete targeting the repo root, home, or a drive root.')
  }
}

process.exit(0)
