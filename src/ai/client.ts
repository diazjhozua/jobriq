import OpenAI from 'openai'
import { requireApiKey, getModel, getBaseUrl } from '../config.js'

let _client: OpenAI | null = null

export function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: requireApiKey(),
      baseURL: getBaseUrl(),
    })
  }
  return _client
}

export function activeModel(override?: string): string {
  return override ?? getModel()
}

export const SYSTEM_PROMPT = `You are an expert resume writer with 20 years of experience helping professionals land their dream jobs at top companies like Google, Amazon, and Microsoft.

Your principles:
- Bullets describe accomplishments, not tasks
- Every bullet answers "so what?" — what was the impact on the user, team, or company?
- Use strong action verbs (Built, Led, Reduced, Increased, Delivered, Automated...)
- Add quantification where possible; use [X units] as a placeholder when the user must supply the number, and set needsQuantification to true
- Keep language concise, specific, and professional
- Never fabricate facts — only enhance what the user has already written`
