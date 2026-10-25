#!/usr/bin/env node
// PreToolUse guard for Bash commands. Exit 2 blocks the call and reports to Claude.

import os from 'node:os'
import path from 'node:path'

const BLOCK_MESSAGE = (reason) =>
  `Blocked by .claude/hooks/guard-bash.mjs: ${reason}\n` +
  'Ask the user before retrying; do not work around this guard.'

const SECRET_PATH = /(^|[\s'"])(\.env(?!\.(example|template|sample))|resumes\/|.*\.(pfx|pem|key)\b|appsettings\.[\w.-]*\.local\.json)/i

// Git global options before the subcommand: -C <path>, -c <k=v>, --git-dir=..., --work-tree=...
const GIT_GLOBAL = /\bgit\s+(?:(?:-C\s+\S+|-c\s+\S+|--git-dir(?:=\S+|\s+\S+)|--work-tree(?:=\S+|\s+\S+)|--namespace(?:=\S+|\s+\S+))\s+)+/g

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

function samePath(a, b) {
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b
}

const input = await readInput()
const command = String(input?.tool_input?.command ?? '')

if (!command) {
  process.exit(0)
}

// Strip quotes and backslashes so `"--out"put` cannot hide a flag from the checks below.
const normalized = command.replace(/["'\\]/g, '')
const git = normalized.replace(GIT_GLOBAL, 'git ')

if (/git\s+commit\b[^\n]*(\s--no-verify\b|\s--no-v[a-z-]*\b|\s-[a-zA-Z]*n[a-zA-Z]*\b)/.test(git)) {
  block('skipping commit hooks is not allowed.')
}

if (
  /git\s+push\b[^\n]*(\s--force\b|\s--force-with-lease\b|\s--mirror\b|\s--delete\b|\s-f\b|\s\+\S+)/.test(git) &&
  /\b(main|master)\b/.test(git)
) {
  block('force-pushing to main/master is destructive.')
}

if (/git\s+reset\b[^\n]*--hard/.test(git)) {
  block('`git reset --hard` discards uncommitted work.')
}

if (
  /\bgit\b[^\n]*\b(diff|log|difftool)\b/.test(git) &&
  /(\s--outp[a-z]*(=|\s|$)|\s--ext-diff\b|\s--extc[a-z]*\b|\s--exec\b|\s--textc[a-z]*\b|\s-c\S*|\s-x\s)/.test(git)
) {
  block('git diff/log/difftool flags can write files or execute external programs.')
}

if (/git\s+-c\s+(alias\.|core\.hooksPath)/.test(normalized)) {
  block('git config overrides can hide commits or skip hooks.')
}

if (/(\b(bash|sh|zsh|dash)\b[^\n]*\s-c\s|\beval\b|\bxargs\b)[^\n]*\bgit\b[^\n]*\bcommit\b/.test(normalized)) {
  block('wrapped commit commands bypass message validation.')
}

if (/\bnpm\b[^\n]*\s--(script-shell|node-options|userconfig|globalconfig)\b/.test(normalized)) {
  block('npm config flags can execute arbitrary code.')
}

if (/git\s+add\b[^\n]*/.test(git) && SECRET_PATH.test(normalized)) {
  block('staging secrets or local resume data.')
}

if (/\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)\b/.test(normalized)) {
  const projectDir = path.resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd())
  const home = os.homedir()
  const targets = command
    .replace(/["']/g, '')
    .split(/\s+/)
    .slice(1)
    .filter((token) => token && !token.startsWith('-'))

  const dangerous = targets.some((target) => {
    if (/^[a-zA-Z]:$/.test(target)) {
      return true
    }

    const expanded = target === '~' || target.startsWith('~/') ? path.join(home, target.slice(1)) : target
    const resolved = path.resolve(expanded)

    return (
      samePath(resolved, path.parse(resolved).root) ||
      samePath(resolved, home) ||
      samePath(resolved, projectDir)
    )
  })

  if (dangerous) {
    block('recursive delete targeting the repo root, home, or a drive root.')
  }
}

process.exit(0)
