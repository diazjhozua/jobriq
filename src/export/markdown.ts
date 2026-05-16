import type { Resume } from '../types/resume.js'

export function toMarkdown(resume: Resume): string {
  const lines: string[] = []

  // ── Header ─────────────────────────────────────────────────────────────────
  lines.push(`# ${resume.personal.name}`)
  lines.push('')

  const contact = [
    resume.personal.email,
    resume.personal.phone,
    resume.personal.location,
  ].filter(Boolean)
  lines.push(contact.join(' | '))

  const links = [
    resume.personal.linkedin ? `[LinkedIn](${resume.personal.linkedin})` : '',
    resume.personal.github ? `[GitHub](${resume.personal.github})` : '',
    resume.personal.website ? `[Website](${resume.personal.website})` : '',
  ].filter(Boolean)
  if (links.length > 0) lines.push(links.join(' | '))

  // ── Summary ────────────────────────────────────────────────────────────────
  if (resume.summary) {
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push('## Professional Summary')
    lines.push('')
    lines.push(resume.summary)
  }

  // ── Experience ─────────────────────────────────────────────────────────────
  const activeExperience = resume.experience.filter(
    (e) => e.company || e.title || e.bullets.length > 0
  )
  if (activeExperience.length > 0) {
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push('## Work Experience')

    for (const exp of activeExperience) {
      lines.push('')
      lines.push(`### ${exp.title} — ${exp.company}`)
      lines.push(`*${exp.startDate} – ${exp.endDate}*`)
      lines.push('')
      const bullets = exp.enhancedBullets?.map((b) => b.enhanced) ?? exp.bullets
      for (const b of bullets) {
        lines.push(`- ${b}`)
      }
    }
  }

  // ── Education ──────────────────────────────────────────────────────────────
  const activeEducation = resume.education.filter((e) => e.school || e.degree)
  if (activeEducation.length > 0) {
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push('## Education')

    for (const edu of activeEducation) {
      lines.push('')
      lines.push(`### ${edu.degree} in ${edu.field} — ${edu.school}`)
      lines.push(`*${edu.startDate} – ${edu.endDate}*`)
      if (edu.gpa) lines.push(`GPA: ${edu.gpa}`)
    }
  }

  // ── Skills ─────────────────────────────────────────────────────────────────
  if (resume.skills.length > 0) {
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push('## Skills')
    lines.push('')
    lines.push(resume.skills.join(', '))
  }

  // ── Projects ───────────────────────────────────────────────────────────────
  const activeProjects = resume.projects.filter((p) => p.name && p.bullets.length > 0)
  if (activeProjects.length > 0) {
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push('## Projects')

    for (const proj of activeProjects) {
      lines.push('')
      const header = proj.url ? `### [${proj.name}](${proj.url})` : `### ${proj.name}`
      lines.push(header)
      for (const b of proj.bullets) {
        lines.push(`- ${b}`)
      }
    }
  }

  lines.push('')
  return lines.join('\n')
}

export function getOutputName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  return slug ? `${slug}-resume` : 'resume'
}
