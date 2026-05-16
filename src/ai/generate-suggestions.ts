import type { Resume, KeywordResult } from '../types/resume.js'
import { getClient, SYSTEM_PROMPT, activeModel } from './client.js'

export async function generateSuggestions(
  resume: Resume,
  keywordResult?: KeywordResult
): Promise<string[]> {
  const client = getClient()

  const bulletsNeedingQuantification = resume.experience.flatMap((exp) =>
    (exp.enhancedBullets ?? [])
      .filter((b) => b.needsQuantification)
      .map((b) => `${exp.company}: "${b.enhanced}"`)
  )

  const context = [
    `Experience entries: ${resume.experience.length}`,
    `Projects: ${resume.projects.length}`,
    `Skills listed: ${resume.skills.length}`,
    `Summary: ${resume.summary ? 'present' : 'missing'}`,
    bulletsNeedingQuantification.length > 0
      ? `Bullets needing quantification:\n${bulletsNeedingQuantification.map((b) => `  - ${b}`).join('\n')}`
      : 'No bullets need quantification',
    keywordResult?.missing.length
      ? `Missing ATS keywords: ${keywordResult.missing.join(', ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `Review this resume profile and provide specific, actionable suggestions to improve it further.

Resume Profile:
${context}

Provide 3–6 concrete suggestions. Each suggestion should be:
- Specific and actionable (not generic advice)
- Focused on what the user should add, change, or fill in their template
- Prioritized by impact

Respond with a JSON object:
{
  "suggestions": [
    "Specific suggestion 1",
    "Specific suggestion 2"
  ]
}`

  const response = await client.chat.completions.create({
    model: activeModel(),
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(response.choices[0].message.content ?? '{}')
  return (parsed.suggestions ?? []) as string[]
}
