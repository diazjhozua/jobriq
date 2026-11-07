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

function descriptionBlock(lines: string[]): {
  description: string
  rest: string[]
} {
  const start = lines.findIndex((line) =>
    line.trimStart().startsWith('Description:'),
  )
  if (start === -1) {
    return { description: '', rest: lines }
  }

  const header = lines[start]
  const indent = header.slice(0, header.length - header.trimStart().length)
  const marker = header.trimStart().slice('Description:'.length).trim()
  if (marker !== '|') {
    return { description: marker, rest: lines }
  }

  const continuation = `${indent}  `
  const block: string[] = []
  let end = start + 1
  for (; end < lines.length; end += 1) {
    const line = lines[end]
    if (line.trim() === '') {
      block.push('')
      continue
    }

    if (!line.startsWith(continuation)) {
      break
    }

    block.push(line.slice(continuation.length).trimEnd())
  }

  return {
    description: block.join('\n').trim(),
    rest: [...lines.slice(0, start), ...lines.slice(end)],
  }
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
    skillsGained: [],
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
    skillsGained: [],
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
  return sectionsNamed(sections, 'PROJECT').map((section) => {
    const { description, rest } = descriptionBlock(section.lines)

    return {
      id: crypto.randomUUID(),
      name: field(rest, 'Name'),
      url: normalizeUrl(field(rest, 'URL')),
      startDate: field(rest, 'Start'),
      endDate: field(rest, 'End'),
      associatedWith:
        field(rest, 'Associated with') || field(rest, 'Associated'),
      description,
      bullets: bullets(rest),
      skillsGained: [],
    }
  })
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
    certifications: [],
    awards: [],
    skills: parseSkills(sections),
    projects: parseProjects(sections),
  }
}
