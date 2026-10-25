#!/usr/bin/env node
// PreToolUse guard for git commit messages. Exit 2 blocks the call and reports to Claude.

const TYPES = 'feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert'
const HEADER = new RegExp(`^(${TYPES})(\\([a-z0-9][a-z0-9._-]*\\))?!?: [a-z0-9][^\\n]*$`)
const MAX_HEADER = 72

const BLOCK_MESSAGE = (reason) =>
  `Blocked by .claude/hooks/guard-commit.mjs: ${reason}\n` +
  'Expected: <type>[(<scope>)][!]: <lowercase imperative description>\n' +
  `Types: ${TYPES.replaceAll('|', ', ')}\n` +
  'Use the /commit skill; do not work around this guard.'

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

// Shell-like tokenizer: single quotes, double quotes, and backslash escapes.
function tokenize(input) {
  const tokens = []
  let current = ''
  let quoted = false
  let quote = ''

  for (let i = 0; i < input.length; i++) {
    const char = input[i]

    if (quote) {
      if (char === quote) {
        quote = ''
      } else if (quote === '"' && char === '\\' && i + 1 < input.length) {
        current += input[++i]
      } else {
        current += char
      }
    } else if (char === '"' || char === "'") {
      quote = char
      quoted = true
    } else if (char === '\\' && i + 1 < input.length) {
      current += input[++i]
      quoted = true
    } else if (/\s/.test(char)) {
      if (quoted || current) {
        tokens.push(current)
      }
      current = ''
      quoted = false
    } else {
      current += char
    }
  }

  if (quoted || current) {
    tokens.push(current)
  }

  return tokens
}

// Return the arguments of every `git commit` invocation, skipping git global options.
function commitInvocations(tokens) {
  const invocations = []

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] !== 'git') {
      continue
    }

    let j = i + 1
    while (j < tokens.length) {
      const token = tokens[j]
      if (['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path'].includes(token)) {
        j += 2
        continue
      }
      if (/^--(git-dir|work-tree|namespace|exec-path)=/.test(token)) {
        j += 1
        continue
      }
      if (token.startsWith('-')) {
        j += 1
        continue
      }
      break
    }

    if (tokens[j] === 'commit') {
      invocations.push(tokens.slice(j + 1))
    }
  }

  return invocations
}

function parseCommitArgs(args) {
  const messages = []
  const blockedFlags = []
  let usesFile = false
  let amend = false
  let noEdit = false
  let dryRun = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '-m' || arg === '--message') {
      messages.push(args[++i] ?? '')
    } else if (arg.startsWith('--message=')) {
      messages.push(arg.slice('--message='.length))
    } else if (arg === '-F' || arg === '--file' || arg.startsWith('--file=') || /^-F./.test(arg)) {
      usesFile = true
    } else if (arg === '--amend') {
      amend = true
    } else if (arg === '--no-edit') {
      noEdit = true
    } else if (arg === '--dry-run' || arg === '--help' || arg === '-h') {
      dryRun = true
    } else if (
      ['--no-verify', '--signoff', '--trailer', '--fixup', '--squash', '--reuse-message', '--reedit-message', '--template', '--edit'].includes(arg) ||
      /^--(trailer|fixup|squash|template|reuse-message|reedit-message)=/.test(arg)
    ) {
      blockedFlags.push(arg)
    } else {
      // Short-flag clusters such as -am "msg" or -ammsg.
      const short = /^-([a-zA-Z]*)m(.*)$/.exec(arg)
      if (short) {
        messages.push(short[2] || (args[++i] ?? ''))
      } else if (/^-[a-zA-Z]*[nsectC][a-zA-Z]*$/.test(arg)) {
        blockedFlags.push(arg)
      }
    }
  }

  return { messages, blockedFlags, usesFile, amend, noEdit, dryRun }
}

function validate(args) {
  const { messages, blockedFlags, usesFile, amend, noEdit, dryRun } = parseCommitArgs(args)

  if (dryRun) {
    return null
  }

  if (blockedFlags.length > 0) {
    return `flags that can add trailers or skip checks are not allowed: ${blockedFlags.join(', ')}.`
  }

  if (usesFile) {
    return 'commit messages must be passed with -m, not read from a file.'
  }

  if (messages.length === 0) {
    return amend && noEdit
      ? null
      : 'no commit message found; pass -m "<type>: <description>" or use --amend --no-edit.'
  }

  const message = messages.join('\n\n')

  if (/\$\(|`|\$\{/.test(message)) {
    return 'command substitution is not allowed inside a commit message.'
  }

  const header = message.split('\n')[0].trim()

  if (!HEADER.test(header)) {
    return `"${header}" does not match Conventional Commits grammar.`
  }

  if ([...header].length > MAX_HEADER) {
    return `header is ${[...header].length} characters; the limit is ${MAX_HEADER}.`
  }

  if (header.endsWith('.')) {
    return 'the description must not end with a period.'
  }

  if (
    /co-authored-by\s*:/i.test(message) ||
    /generated with/i.test(message) ||
    /noreply@anthropic\.com/i.test(message) ||
    message.includes('🤖')
  ) {
    return 'attribution trailers are not allowed in this repository.'
  }

  if (/^breaking[- ]change\s*:/m.test(message)) {
    return 'BREAKING CHANGE must be uppercase.'
  }

  return null
}

const input = await readInput()
const command = String(input?.tool_input?.command ?? '')

if (!command) {
  process.exit(0)
}

for (const args of commitInvocations(tokenize(command))) {
  const reason = validate(args)
  if (reason) {
    block(reason)
  }
}

process.exit(0)
