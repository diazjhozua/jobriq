import type {
  Education,
  Profile,
  Project,
  SummaryType,
  WorkExperience,
} from './types'

interface Section {
  name: string
  lines: string[]
}

function splitSections(raw: string): Section[] {
  const sections: Section[] = []
  let current: Section | null = null

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trimEnd()
    const header = /^\[([A-Z ]+)\]$/.exec(line)
    if (header) {
      if (current) {
        sections.push(current)
      }

      current = { name: header[1], lines: [] }
    } else if (current) {
      current.lines.push(line)
    }
  }

  if (current) {
    sections.push(current)
  }

  return sections
}

function contentLines(lines: string[]): string[] {
  return lines.filter((line) => !line.startsWith('#') && line.trim() !== '')
}

function sectionsNamed(sections: Section[], name: string): Section[] {
  return sections.filter((section) => section.name === name)
}

function field(lines: string[], key: string): string {
  const prefix = `${key}:`
  const line = lines.find((candidate) => candidate.trimStart().startsWith(prefix))
  if (!line) {
    return ''
  }

  return line.slice(line.indexOf(prefix) + prefix.length).trim()
}

function bullets(lines: string[]): string[] {
  return contentLines(lines)
    .filter((line) => line.trimStart().startsWith('-'))
    .map((line) => line.replace(/^\s*-\s*/, '').trim())
    .filter((line) => line.length > 0 && !line.startsWith('('))
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  return /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function parseSummaryType(value: string): SummaryType {
  return value.toLowerCase() === 'objective' ? 'objective' : 'professional'
}

function parseExperience(sections: Section[]): WorkExperience[] {
  return sectionsNamed(sections, 'EXPERIENCE').map((section) => ({
    id: crypto.randomUUID(),
    company: field(section.lines, 'Company'),
    title: field(section.lines, 'Title'),
    startDate: field(section.lines, 'Start'),
    endDate: field(section.lines, 'End'),
    bullets: bullets(section.lines),
  }))
}

function parseEducation(sections: Section[]): Education[] {
  return sectionsNamed(sections, 'EDUCATION').map((section) => ({
    id: crypto.randomUUID(),
    school: field(section.lines, 'School'),
    degree: field(section.lines, 'Degree'),
    field: field(section.lines, 'Field'),
    startDate: field(section.lines, 'Start'),
    endDate: field(section.lines, 'End'),
    gpa: field(section.lines, 'GPA'),
  }))
}

function parseSkills(sections: Section[]): string[] {
  const section = sectionsNamed(sections, 'SKILLS')[0]
  if (!section) {
    return []
  }

  return contentLines(section.lines)
    .join(' ')
    .split(',')
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 0)
}

function parseProjects(sections: Section[]): Project[] {
  return sectionsNamed(sections, 'PROJECT').map((section) => ({
    id: crypto.randomUUID(),
    name: field(section.lines, 'Name'),
    url: normalizeUrl(field(section.lines, 'URL')),
    bullets: bullets(section.lines),
  }))
}

export function parseResumeTemplate(raw: string): Profile {
  const sections = splitSections(raw)
  if (sections.length === 0) {
    throw new Error('No template sections found. Paste the contents of my-resume.txt.')
  }

  const personalSection = sectionsNamed(sections, 'PERSONAL')[0]
  const summarySection = sectionsNamed(sections, 'SUMMARY')[0]
  const personalLines = personalSection?.lines ?? []
  const summaryLines = summarySection?.lines ?? []

  return {
    personal: {
      name: field(personalLines, 'Name'),
      email: field(personalLines, 'Email'),
      phone: field(personalLines, 'Phone'),
      location: field(personalLines, 'Location'),
      linkedin: normalizeUrl(field(personalLines, 'LinkedIn')),
      github: normalizeUrl(field(personalLines, 'GitHub')),
      website: normalizeUrl(field(personalLines, 'Website')),
    },
    summaryType: parseSummaryType(field(summaryLines, 'Type')),
    summary: field(summaryLines, 'Content'),
    experience: parseExperience(sections),
    education: parseEducation(sections),
    skills: parseSkills(sections),
    projects: parseProjects(sections),
  }
}
