import { execFileSync } from 'node:child_process'

export default function globalTeardown(): void {
  try {
    execFileSync('docker', ['rm', '-f', 'jobriq-e2e-postgres'], { stdio: 'ignore' })
  } catch {
    // The container is already gone.
  }
}
