import type { WorkExperience } from '../types/resume.js'
import { getClient, SYSTEM_PROMPT } from './client.js'

export async function generateSummary(
  experience: WorkExperience[],
  summaryType: 'objective' | 'professional'
): Promise<string> {
  const client = getClient()

  const expText = experience
    .map((exp) => {
      const bullets =
        exp.enhancedBullets?.map((b) => `- ${b.enhanced}`) ?? exp.bullets.map((b) => `- ${b}`)
      return `${exp.title} at ${exp.company} (${exp.startDate} – ${exp.endDate})\n${bullets.join('\n')}`
    })
    .join('\n\n')

  const typeDesc =
    summaryType === 'objective'
      ? 'objective statement for someone with less than 2 years of experience — highlights education, skills, and career goals'
      : 'professional summary for someone with 2+ years of experience — highlights expertise, key achievements, and value delivered'

  const prompt = `Write a ${typeDesc} based on the work experience below.

Requirements:
- Maximum 3 lines
- Concise and impactful — no filler phrases
- Written without using "I"
- Highlight the most impressive aspects of the candidate's background

Work Experience:
${expText}

Respond with only the summary text — no quotes, no labels, no extra explanation.`

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  })

  return response.choices[0].message.content?.trim() ?? ''
}
