import dotenv from 'dotenv'
import path from 'path'
import os from 'os'

// Load ~/.jobriq/.env first, then local .env (local overrides global)
dotenv.config({ path: path.join(os.homedir(), '.jobriq', '.env'), quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env'), quiet: true })

export const DEFAULT_MODEL = 'gpt-4o'

export const SUPPORTED_MODELS = [
  { id: 'gpt-4o',        label: 'Best balance of quality and speed (recommended)' },
  { id: 'gpt-4.1',       label: 'Highest quality, best instruction following' },
  { id: 'gpt-4o-mini',   label: 'Faster and cheaper, good for quick iterations' },
  { id: 'gpt-4.1-mini',  label: 'Good balance of quality and cost' },
]

export function getApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY
}

export function getModel(): string {
  return process.env.OPENAI_MODEL ?? DEFAULT_MODEL
}

export function getBaseUrl(): string | undefined {
  return process.env.OPENAI_BASE_URL
}

export function hasApiKey(): boolean {
  const key = getApiKey()
  return typeof key === 'string' && key.length > 0
}

export function requireApiKey(): string {
  const key = getApiKey()
  if (!key) throw new Error('OPENAI_API_KEY not set. Copy .env.template to .env and fill in your key.')
  return key
}
