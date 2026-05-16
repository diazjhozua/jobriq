import type { WorkExperience, EnhancedBullet } from '../types/resume.js'
import { getClient, SYSTEM_PROMPT } from './client.js'

export async function enhanceBullets(exp: WorkExperience): Promise<EnhancedBullet[]> {
  const client = getClient()

  const bulletList = exp.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')

  const prompt = `Enhance the following resume bullet points for the role of "${exp.title}" at "${exp.company}".

For each bullet:
1. Rewrite it as an accomplishment (not a task description)
2. Add results or outcomes — answer "so what?"
3. Use a strong action verb at the start
4. If a specific number would strengthen the bullet but you cannot determine it, insert [X unit] as a placeholder and set needsQuantification to true
5. If the bullet already has a number or the impact is inherently clear, set needsQuantification to false

Bullets:
${bulletList}

Respond with a JSON object:
{
  "bullets": [
    {
      "original": "exact original text",
      "enhanced": "rewritten bullet",
      "needsQuantification": true or false
    }
  ]
}`

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(response.choices[0].message.content ?? '{}')
  return (parsed.bullets ?? []) as EnhancedBullet[]
}
