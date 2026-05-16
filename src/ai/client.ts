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

export function parseJsonResponse(content: string): any {
  const text = content.trim()
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  const raw = fenced ? fenced[1] : text

  // Escape literal control characters inside JSON string values
  let inString = false
  let escaped = false
  let result = ''
  for (const char of raw) {
    if (escaped) { result += char; escaped = false; continue }
    if (char === '\\' && inString) { result += char; escaped = true; continue }
    if (char === '"') { inString = !inString; result += char; continue }
    if (inString && char.charCodeAt(0) < 0x20) {
      if (char === '\n') result += '\\n'
      else if (char === '\r') result += '\\r'
      else if (char === '\t') result += '\\t'
      continue
    }
    result += char
  }

  return JSON.parse(result)
}
