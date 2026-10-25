#!/usr/bin/env node
// Stop hook for local development: run the fast verification tier when the
// working tree has changes, so a broken build is reported before the turn ends.
// This script only runs the repository's own npm and dotnet build commands.

import { spawnSync } from 'node:child_process'
import path from 'node:path'

const PROJECT_DIR = path.resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd())
const WEB_DIR = path.join(PROJECT_DIR, 'web')

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

function run(file, args, timeout) {
  const result = spawnSync(file, args, {
    cwd: WEB_DIR,
    shell: true,
    encoding: 'utf8',
    timeout,
  })

  if (result.status === 0) {
    return null
  }

  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
    .trim()
    .split('\n')
    .slice(-30)
    .join('\n')

  return { label: [file, ...args].join(' '), output }
}

const input = await readInput()

// Claude is already continuing because of this hook: do not loop.
if (input?.stop_hook_active === true) {
  process.exit(0)
}

if (process.env.CLAUDE_SKIP_VERIFY === '1') {
  process.exit(0)
}

const status = spawnSync('git', ['status', '--porcelain'], {
  cwd: PROJECT_DIR,
  encoding: 'utf8',
  timeout: 15_000,
})

if (status.status !== 0 || (status.stdout ?? '').trim() === '') {
  process.exit(0)
}

const steps = [
  ['npm', ['--prefix', 'client', 'run', 'typecheck'], 90_000],
  ['npm', ['--prefix', 'client', 'run', 'lint'], 60_000],
  ['dotnet', ['build', 'Jobriq.sln'], 150_000],
]

for (const [file, args, timeout] of steps) {
  const failure = run(file, args, timeout)
  if (failure) {
    process.stderr.write(
      `Stop verification failed: ${failure.label}\n${failure.output}\n` +
        'Fix the failure, or set CLAUDE_SKIP_VERIFY=1 if it is unrelated to this change.\n',
    )
    process.exit(2)
  }
}

process.exit(0)
