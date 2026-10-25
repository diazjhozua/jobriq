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

const SHELL_WRAPPERS = new Set([
  '.',
  'ash',
  'bash',
  'busybox',
  'cmd',
  'csh',
  'dash',
  'eval',
  'fish',
  'ksh',
  'mksh',
  'powershell',
  'pwsh',
  'sh',
  'source',
  'tcsh',
  'zsh',
])

const PREFIX_WRAPPERS = new Set([
  'builtin',
  'command',
  'env',
  'exec',
  'ionice',
  'nice',
  'nohup',
  'parallel',
  'setsid',
  'stdbuf',
  'sudo',
  'time',
  'timeout',
  'xargs',
])

const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/
const UNSAFE_COMMAND_CHAR = /[$`\\*?[]/
const SEGMENT_SEPARATOR = /\s*(?:&&|\|\||;|\n|\||&|\(|\)|\{|\}|\$\(|`)\s*/

function splitCommandSegments(command) {
  return command.split(SEGMENT_SEPARATOR)
}

// A command word built from expansion, globbing, or escaping cannot be resolved statically.
function hasUnsafeCommandWord(command) {
  for (const segment of splitCommandSegments(command)) {
    const tokens = segment.split(/\s+/).filter(Boolean)
    let index = 0
    while (index < tokens.length && ASSIGNMENT.test(tokens[index])) {
      index++
    }
    if (index >= tokens.length) {
      continue
    }

    const first = commandName(tokens[index])

    if (SHELL_WRAPPERS.has(first)) {
      if (tokens.slice(index + 1).some((token) => UNSAFE_COMMAND_CHAR.test(token))) {
        return true
      }
      continue
    }

    if (PREFIX_WRAPPERS.has(first)) {
      if (tokens.slice(index + 1).some((token) => UNSAFE_COMMAND_CHAR.test(token))) {
        return true
      }
      continue
    }

    if (UNSAFE_COMMAND_CHAR.test(tokens[index])) {
      return true
    }
  }

  return false
}

const RM_RECURSIVE_LONG = /^--r(e(c(u(r(s(i(v(e)?)?)?)?)?)?)?)?$/
const RM_SAFE_LONG = new Set([
  '--',
  '--dir',
  '--force',
  '--help',
  '--interactive',
  '--no-preserve-root',
  '--one-file-system',
  '--preserve-root',
  '--verbose',
  '--version',
])

function recursiveFlag(token) {
  if (!token.startsWith('-')) {
    return false
  }
  if (/^-[a-zA-Z]*r/i.test(token) || RM_RECURSIVE_LONG.test(token)) {
    return true
  }
  return token.startsWith('--') && !RM_SAFE_LONG.has(token)
}

function hasRecursiveRm(command) {
  return splitSegments(command).some((segment) => {
    const tokens = segment.split(/\s+/).filter(Boolean)
    const rmIndex = tokens.findIndex((token) => commandName(token).replace(/^[({$]+/, '') === 'rm')
    if (rmIndex === -1) {
      return false
    }

    return tokens.slice(rmIndex + 1).some(recursiveFlag)
  })
}

// find -delete and find -exec can remove files or run arbitrary commands.
function runsFindDelete(command) {
  const normalized = command.replace(/["'\\]/g, '')

  return splitCommandSegments(normalized).some((segment) => {
    const tokens = segment.split(/\s+/).filter(Boolean)
    let index = 0
    while (index < tokens.length && ASSIGNMENT.test(tokens[index])) {
      index++
    }
    if (index >= tokens.length) {
      return false
    }

    const first = commandName(tokens[index])
    if (first !== 'find' && !SHELL_WRAPPERS.has(first) && !PREFIX_WRAPPERS.has(first)) {
      return false
    }

    const scope = first === 'find' ? tokens.slice(index) : tokens.slice(index + 1)
    return (
      scope.some((token) => commandName(token).replace(/^[({$]+/, '') === 'find') &&
      scope.some((token) => /^-(delete|exec|execdir|ok|okdir|fprint|fprint0|fprintf|fls)\)*$/.test(token))
    )
  })
}

// Resolve every recursive-delete target. Any directory change or shell wrapper fails closed.
function recursiveDeleteTargets(command, projectDir, home) {
  // A command word built from expansion, globbing, or escaping cannot be resolved statically.
  if (hasUnsafeCommandWord(command)) {
    return [{ resolved: null, cwd: projectDir }]
  }

  const unescaped = command.replace(/\\/g, '')
  if (unescaped !== command && hasRecursiveRm(unescaped)) {
    return [{ resolved: null, cwd: projectDir }]
  }
  if (/\brm\b/i.test(command) && /[$`\\]/.test(command)) {
    return [{ resolved: null, cwd: projectDir }]
  }

  if (!hasRecursiveRm(command)) {
    return []
  }

  const tokens = splitSegments(command).flatMap((segment) => segment.split(/\s+/).filter(Boolean))
  const directoryChange = tokens.some((token) => ['cd', 'pushd', 'popd'].includes(commandName(token)))
  const envChdir = tokens.some((token) => token === '-C' || token === '--chdir' || token.startsWith('--chdir='))
  const shellWrapper = tokens.some((token) =>
    [
      '.',
      'ash',
      'bash',
      'busybox',
      'cmd',
      'csh',
      'dash',
      'eval',
      'find',
      'fish',
      'ksh',
      'mksh',
      'parallel',
      'powershell',
      'pwsh',
      'sh',
      'source',
      'tcsh',
      'xargs',
      'zsh',
    ].includes(commandName(token)),
  )
  const grouped = /[(){}]/.test(command.replace(/["']/g, '')) || /\$\(/.test(command)
  const quotedSpace = /["'][^"']*\s[^"']*["']/.test(command)
  const escapedSpace = /\\\s/.test(command)
  const piped = /\|/.test(command)

  if (
    directoryChange ||
    envChdir ||
    /\bCDPATH\b/.test(command) ||
    shellWrapper ||
    grouped ||
    quotedSpace ||
    escapedSpace ||
    piped
  ) {
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
    if (!flags.some(recursiveFlag)) {
      continue
    }

    let positional = 0
    for (const token of segmentTokens.slice(rmIndex + 1)) {
      if (token.startsWith('-')) {
        continue
      }

      positional++
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

    if (positional === 0) {
      return [{ resolved: null, cwd: projectDir }]
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

if (runsFindDelete(command)) {
  block('find can delete files or execute commands.')
}

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
