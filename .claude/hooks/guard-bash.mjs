#!/usr/bin/env node
// PreToolUse guard for Bash commands. Exit 2 blocks the call and reports to Claude.

import os from 'node:os'
import path from 'node:path'

const BLOCK_MESSAGE = (reason) =>
  `Blocked by .claude/hooks/guard-bash.mjs: ${reason}\n` +
  'Ask the user before retrying; do not work around this guard.'

const SECRET_PATH = /(^|[\s'"])(\.env(?!\.(example|template|sample))|resumes\/|.*\.(pfx|pem|key)\b|appsettings\.[\w.-]*\.local\.json)/i

// Match a git subcommand after any global options, e.g. `git --no-pager commit`.
const gitRuns = (names) => new RegExp(`\\bgit\\b[^\\n;&|]*\\b(?:${names})\\b`)

const GIT_COMMIT = gitRuns('commit')
const GIT_PUSH = gitRuns('push')
const GIT_RESET = gitRuns('reset')
const GIT_DIFF = gitRuns('diff|log|difftool')
const GIT_ADD = gitRuns('add')

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

function isSameOrAncestor(candidate, target) {
  const from = process.platform === 'win32' ? candidate.toLowerCase() : candidate
  const to = process.platform === 'win32' ? target.toLowerCase() : target
  const relative = path.relative(from, to)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function expandHome(target, home) {
  return target === '~' || target.startsWith('~/') ? path.join(home, target.slice(1)) : target
}

function commandName(token) {
  return path.basename(token.replace(/\\/g, '/')).replace(/\.exe$/i, '').toLowerCase()
}

function splitSegments(command) {
  return command.replace(/["']/g, '').split(/\s*(?:&&|\|\||;|\n)\s*/)
}

function hasRecursiveRm(command) {
  return splitSegments(command).some((segment) => {
    const tokens = segment.split(/\s+/).filter(Boolean)
    const rmIndex = tokens.findIndex((token) => commandName(token).replace(/^[({$]+/, '') === 'rm')
    if (rmIndex === -1) {
      return false
    }

    return tokens
      .slice(rmIndex + 1)
      .some((token) => token.startsWith('-') && (/^-[a-zA-Z]*r/i.test(token) || token === '--recursive'))
  })
}

// Resolve every recursive-delete target. Any directory change or shell wrapper fails closed.
function recursiveDeleteTargets(command, projectDir, home) {
  if (!hasRecursiveRm(command)) {
    return []
  }

  const tokens = splitSegments(command).flatMap((segment) => segment.split(/\s+/).filter(Boolean))
  const directoryChange = tokens.some((token) => ['cd', 'pushd', 'popd'].includes(commandName(token)))
  const envChdir = tokens.some((token) => token === '-C' || token === '--chdir' || token.startsWith('--chdir='))
  const shellWrapper = tokens.some((token) =>
    ['bash', 'sh', 'zsh', 'dash', 'ksh', 'fish', 'busybox', 'pwsh', 'powershell', 'cmd', 'eval', 'source', 'xargs'].includes(
      commandName(token),
    ),
  )
  const grouped = /[(){}]/.test(command.replace(/["']/g, '')) || /\$\(/.test(command)
  const quotedSpace = /["'][^"']*\s[^"']*["']/.test(command)
  const escapedSpace = /\\\s/.test(command)

  if (directoryChange || envChdir || /\bCDPATH\b/.test(command) || shellWrapper || grouped || quotedSpace || escapedSpace) {
    return [{ resolved: null, cwd: projectDir }]
  }

  const targets = []
  for (const segment of splitSegments(command)) {
    const segmentTokens = segment.split(/\s+/).filter(Boolean)
    const rmIndex = segmentTokens.findIndex((token) => commandName(token).replace(/^[({$]+/, '') === 'rm')
    if (rmIndex === -1) {
      continue
    }

    const flags = segmentTokens.slice(rmIndex + 1).filter((token) => token.startsWith('-'))
    if (!flags.some((flag) => /^-[a-zA-Z]*r/i.test(flag) || flag === '--recursive')) {
      continue
    }

    for (const token of segmentTokens.slice(rmIndex + 1)) {
      if (token.startsWith('-')) {
        continue
      }

      const expanded = path.resolve(projectDir, expandHome(token, home))
      const wildcard = token.search(/[*?\[]/)
      const tildeDanger = token.startsWith('~') && token !== '~' && !token.startsWith('~/')
      const parentSegment = token.split(/[\\/]/).includes('..')
      let globDanger = false
      if (wildcard !== -1) {
        const prefix = path.resolve(projectDir, expandHome(token.slice(0, wildcard), home))
        globDanger = samePath(prefix, projectDir) || !isSameOrAncestor(projectDir, prefix) || parentSegment
      }

      targets.push({
        resolved: /[$`]/.test(token) || tildeDanger || globDanger ? null : expanded,
        cwd: projectDir,
      })
    }
  }

  return targets
}

const input = await readInput()
const command = String(input?.tool_input?.command ?? '')

if (!command) {
  process.exit(0)
}

// Strip quotes and backslashes so `"--out"put` cannot hide a flag from the checks below.
const normalized = command.replace(/["'\\]/g, '')
const git = normalized

if (GIT_COMMIT.test(git) && /(\s--no-verify\b|\s--no-v[a-z-]*\b|\s-[a-zA-Z]*n[a-zA-Z]*\b)/.test(git)) {
  block('skipping commit hooks is not allowed.')
}

if (
  GIT_PUSH.test(git) &&
  /(\s--force\b|\s--force-with-lease\b|\s--mirror\b|\s--delete\b|\s-f\b|\s\+\S+)/.test(git) &&
  /\b(main|master)\b/.test(git)
) {
  block('force-pushing to main/master is destructive.')
}

if (GIT_RESET.test(git) && /\s--hard\b/.test(git)) {
  block('`git reset --hard` discards uncommitted work.')
}

if (
  GIT_DIFF.test(git) &&
  /(\s--outp[a-z-]*(=|\s|$)|\s--ext-diff\b|\s--extc[a-z]*\b|\s--exec\b|\s--textc[a-z]*\b|\s-c\S*|\s-x\s)/.test(git)
) {
  block('git diff/log/difftool flags can write files or execute external programs.')
}

if (
  /\bgit\b[^\n;&|]*\s-c\s*\S*(?:alias\.|core\.hookspath)/i.test(git) ||
  /\bgit\b[^\n;&|]*--config-env(?:=|\s)/i.test(git) ||
  /\bgit\b[^\n;&|]*\bconfig\b[^\n;&|]*\b(?:alias\.|core\.hookspath)\b/i.test(git) ||
  /\bGIT_CONFIG_(?:COUNT|PARAMETERS|GLOBAL|SYSTEM|KEY_\d+|VALUE_\d+)\b/i.test(normalized)
) {
  block('git config overrides can hide commits or skip hooks.')
}

if (/(\b(bash|sh|zsh|dash)\b[^\n]*\s-c\s|\beval\b|\bxargs\b)[^\n]*\bgit\b[^\n]*\bcommit\b/.test(normalized)) {
  block('wrapped commit commands bypass message validation.')
}

if (/\bnpm\b[^\n]*\s--(script-shell|node-options|userconfig|globalconfig)\b/.test(normalized)) {
  block('npm config flags can execute arbitrary code.')
}

if (GIT_ADD.test(git) && SECRET_PATH.test(normalized)) {
  block('staging secrets or local resume data.')
}

const projectDir = path.resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd())
const home = os.homedir()

const dangerousDelete = recursiveDeleteTargets(command, projectDir, home).some(({ resolved, cwd }) => {
  if (resolved === null) {
    return true
  }

  return (
    samePath(resolved, path.parse(resolved).root) ||
    isSameOrAncestor(resolved, home) ||
    isSameOrAncestor(resolved, projectDir) ||
    isSameOrAncestor(resolved, cwd)
  )
})

if (dangerousDelete) {
  block('recursive delete targeting the repo, home, a drive root, or their ancestors.')
}

process.exit(0)
