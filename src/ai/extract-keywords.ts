import type { Resume, KeywordResult } from '../types/resume.js'
import { getClient, SYSTEM_PROMPT, activeModel } from './client.js'

export async function extractKeywords(jobDescription: string, resume: Resume): Promise<KeywordResult> {
  const client = getClient()

  const resumeText = [
    resume.skills.join(', '),
    ...resume.experience.flatMap((exp) => [
      `${exp.title} at ${exp.company}`,
      ...(exp.enhancedBullets?.map((b) => b.enhanced) ?? exp.bullets),
    ]),
    ...resume.projects.flatMap((p) => p.bullets),
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `Extract the top 20 most important keywords from this job description (skills, technologies, tools, methodologies, certifications).

Then check which of those keywords genuinely appear in the resume text below. Be strict — only mark a keyword as matched if it clearly appears in the resume.

Job Description:
${jobDescription}

Resume Text:
${resumeText}

Respond with a JSON object:
{
  "matched": ["keyword1", "keyword2"],
  "missing": ["keyword3", "keyword4"]
}

Rules:
- Total keywords (matched + missing) must be exactly 20
- Only include a keyword in "matched" if it clearly appears in the resume text
- Keywords should be specific terms, not generic phrases`

  const response = await client.chat.completions.create({
    model: activeModel(),
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(response.choices[0].message.content ?? '{}')
  return {
    matched: (parsed.matched ?? []) as string[],
    missing: (parsed.missing ?? []) as string[],
  }
}
