import { execFileSync, execSync, spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const container = 'jobriq-e2e-postgres'
const database = `jobriq_e2e_${Date.now()}`

function runDocker(args) {
  return execFileSync('docker', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function removeContainer() {
  try {
    execFileSync('docker', ['rm', '-f', container], { stdio: 'ignore' })
  } catch {
    // No previous container to remove.
  }
}

function canConnect(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
  })
}

async function waitForPostgres(port) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (await canConnect(port)) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`PostgreSQL did not accept connections on 127.0.0.1:${port}.`)
}

removeContainer()

try {
  runDocker([
    'run',
    '-d',
    '--rm',
    '--name',
    container,
    '-e',
    'POSTGRES_USER=jobriq',
    '-e',
    'POSTGRES_DB=jobriq',
    '-e',
    'POSTGRES_HOST_AUTH_METHOD=trust',
    '-p',
    '127.0.0.1::5432',
    'postgres:18-alpine',
  ])
} catch (error) {
  const detail = error.stderr ? String(error.stderr).trim() : error.message
  throw new Error(`Could not start PostgreSQL for e2e. Is Docker running?\n${detail}`)
}

const portOutput = runDocker(['port', container, '5432/tcp']).trim()
const port = portOutput.slice(portOutput.lastIndexOf(':') + 1)

await waitForPostgres(port)

execSync('npm run build', { cwd: root, stdio: 'inherit' })

const server = spawn(
  'dotnet',
  [
    'run',
    '--project',
    path.join(root, 'src/Jobriq.Web'),
    '--urls',
    'http://localhost:5081',
    '--no-launch-profile',
    '--',
    '--environment',
    'Testing',
  ],
  {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      ASPNETCORE_ENVIRONMENT: 'Testing',
      ConnectionStrings__Database: `Host=127.0.0.1;Port=${port};Database=${database};Username=jobriq`,
      Database__ApplyMigrationsOnStartup: 'true',
    },
  },
)

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal))
}

server.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0))
})
