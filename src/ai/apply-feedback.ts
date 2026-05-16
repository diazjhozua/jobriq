import type { SessionState } from '../types/resume.js'
import { getClient, SYSTEM_PROMPT } from './client.js'

interface FeedbackChanges {
  summary?: string
  experience?: Array<{
    id: string
    bullets: string[]
  }>
}

export async function applyFeedback(state: SessionState, feedback: string): Promise<SessionState> {
  const client = getClient()

  const resumeSnapshot = buildResumeSnapshot(state)

  const prompt = `The user has provided feedback about their resume. Apply the requested changes.

Current Resume State:
${resumeSnapshot}

User Feedback:
"${feedback}"

Respond with a JSON object containing only the fields that need to change. Omit fields that are unchanged.
{
  "summary": "updated summary if changed",
  "experience": [
    {
      "id": "exact id from above",
      "bullets": ["full updated bullet list — include ALL bullets, not just changed ones"]
    }
  ]
}

Rules:
- Only include "summary" if the summary needs to change
- Only include experiences that have changed bullets
- Return the complete bullet list for any changed experience (not just the modified bullet)
- Keep bullets as accomplishment-focused statements
- Preserve [X unit] placeholders where quantification is still needed`

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  })

  const changes: FeedbackChanges = JSON.parse(response.choices[0].message.content ?? '{}')
  return mergeChanges(state, changes)
}

function buildResumeSnapshot(state: SessionState): string {
  const { resume } = state
  const lines: string[] = []

  lines.push(`Summary (${resume.summaryType}):`)
  lines.push(resume.summary || '(not yet generated)')
  lines.push('')

  for (const exp of resume.experience) {
    lines.push(`Experience [id: ${exp.id}] — ${exp.title} at ${exp.company} (${exp.startDate} – ${exp.endDate}):`)
    const bullets = exp.enhancedBullets?.map((b) => b.enhanced) ?? exp.bullets
    bullets.forEach((b) => lines.push(`  - ${b}`))
    lines.push('')
  }

  return lines.join('\n')
}

function mergeChanges(state: SessionState, changes: FeedbackChanges): SessionState {
  const resume = { ...state.resume }

  if (changes.summary !== undefined) {
    resume.summary = changes.summary
  }

  if (changes.experience) {
    resume.experience = resume.experience.map((exp) => {
      const update = changes.experience?.find((e) => e.id === exp.id)
      if (!update) return exp
      return {
        ...exp,
        enhancedBullets: update.bullets.map((enhanced) => ({
          original: exp.enhancedBullets?.find((b) => b.enhanced === enhanced)?.original ?? enhanced,
          enhanced,
          needsQuantification: /\[.+?\]/.test(enhanced),
        })),
      }
    })
  }

  return { ...state, resume }
}
