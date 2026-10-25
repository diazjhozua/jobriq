#!/usr/bin/env node
// PreToolUse guard for Write/Edit. Exit 2 blocks the call and reports to Claude.

import os from 'node:os'
import path from 'node:path'

const PROJECT_DIR = path.resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd())
const CLAUDE_HOME = path.resolve(os.homedir(), '.claude')
const PLANS_DIR = path.resolve(CLAUDE_HOME, 'plans')
const MEMORY_DIR = path.resolve(CLAUDE_HOME, 'projects', PROJECT_DIR.replace(/[^a-zA-Z0-9]/g, '-'), 'memory')

function isInside(base, target) {
  const relative = path.relative(base, target)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

const BLOCKED_SEGMENTS = ['/bin/', '/obj/', '/node_modules/', '/test-results/', '/wwwroot/']
const BLOCKED_BASENAME = /^\.env(?!\.(example|template|sample))/i

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

const input = await readInput()
const rawPath = String(input?.tool_input?.file_path ?? '')

if (!rawPath) {
  process.exit(0)
}

const absolute = path.resolve(PROJECT_DIR, rawPath)
const relative = path.relative(PROJECT_DIR, absolute).replace(/\\/g, '/')

const plansRelative = path.relative(PLANS_DIR, absolute)
const inPlans =
  plansRelative !== '' &&
  !plansRelative.startsWith('..') &&
  !path.isAbsolute(plansRelative) &&
  !plansRelative.includes(path.sep) &&
  path.extname(plansRelative) === '.md'
const harnessPath = inPlans || isInside(MEMORY_DIR, absolute)

const blocked =
  BLOCKED_BASENAME.test(path.basename(absolute)) ||
  BLOCKED_SEGMENTS.some((segment) => `/${absolute.replace(/\\/g, '/')}`.includes(segment)) ||
  (!harnessPath && relative.startsWith('../'))

if (blocked) {
  process.stderr.write(
    `Blocked by .claude/hooks/guard-write.mjs: refusing to write ${relative}.\n` +
      'Generated output, build artifacts, dependencies, and secrets are not edited directly.\n',
  )
  process.exit(2)
}

process.exit(0)
