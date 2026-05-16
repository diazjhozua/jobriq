import { nanoid } from 'nanoid'
import type { Resume, WorkExperience, Education, Project } from '../types/resume.js'

interface Section {
  name: string
  lines: string[]
}

export function parseTemplate(raw: string): Resume {
  const sections = splitSections(raw)
  return {
    version: '1',
    personal: parsePersonal(sections),
    summaryType: parseSummaryType(sections),
    summary: parseSummaryContent(sections),
    experience: parseExperience(sections),
    education: parseEducation(sections),
    skills: parseSkills(sections),
    projects: parseProjects(sections),
    jobDescription: parseJobDescription(sections),
  }
}

export function parseSuggestionsBlock(raw: string): string {
  const sections = splitSections(raw)
  const block = sections.find((s) => s.name === 'AI SUGGESTIONS')
  if (!block) return ''
  return block.lines
    .filter((l) => !l.startsWith('#'))
    .join('\n')
    .trim()
}

export function writeSuggestionsBlock(raw: string, suggestions: string[]): string {
  const header = '[AI SUGGESTIONS]'
  const headerIdx = raw.indexOf(header)
  if (headerIdx === -1) return raw + '\n\n' + buildSuggestionsBlock(suggestions)

  // Find where the next section starts (or end of file)
  const afterHeader = headerIdx + header.length
  const nextSectionMatch = raw.slice(afterHeader).match(/\n\[/)
  const blockEnd =
    nextSectionMatch && nextSectionMatch.index !== undefined
      ? afterHeader + nextSectionMatch.index
      : raw.length

  const before = raw.slice(0, headerIdx)
  const after = raw.slice(blockEnd)
  return before + buildSuggestionsBlock(suggestions) + after
}

function buildSuggestionsBlock(suggestions: string[]): string {
  const lines = [
    '[AI SUGGESTIONS]',
    '# This section is automatically updated after each "jobriq build" run.',
    '# Review these, update your template, then re-run "jobriq build" to improve.',
    ...suggestions.map((s, i) => `# ${i + 1}. ${s}`),
  ]
  return lines.join('\n') + '\n'
}

// ── Section splitting ────────────────────────────────────────────────────────

function splitSections(raw: string): Section[] {
  const sections: Section[] = []
  let current: Section | null = null

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trimEnd()
    const header = line.match(/^\[([A-Z ]+)\]$/)
    if (header) {
      if (current) sections.push(current)
      current = { name: header[1], lines: [] }
    } else if (current) {
      current.lines.push(line)
    }
  }
  if (current) sections.push(current)
  return sections
}

function contentLines(lines: string[]): string[] {
  return lines.filter((l) => !l.startsWith('#') && l.trim() !== '')
}

function allSectionsNamed(sections: Section[], name: string): Section[] {
  return sections.filter((s) => s.name === name)
}

function firstSection(sections: Section[], name: string): Section | undefined {
  return sections.find((s) => s.name === name)
}

// ── Field parsing ────────────────────────────────────────────────────────────

function field(lines: string[], key: string): string {
  const prefix = `${key}:`
  const line = lines.find((l) => l.trimStart().startsWith(prefix))
  if (!line) return ''
  return line.slice(line.indexOf(prefix) + prefix.length).trim()
}

function bullets(lines: string[]): string[] {
  return contentLines(lines)
    .filter((l) => l.trimStart().startsWith('-'))
    .map((l) => l.replace(/^\s*-\s*/, '').trim())
    .filter((l) => l.length > 0 && !l.startsWith('('))
}

// ── Section parsers ──────────────────────────────────────────────────────────

function parsePersonal(sections: Section[]): Resume['personal'] {
  const sec = firstSection(sections, 'PERSONAL')
  const lines = sec?.lines ?? []
  return {
    name: field(lines, 'Name'),
    email: field(lines, 'Email'),
    phone: field(lines, 'Phone'),
    location: field(lines, 'Location'),
    linkedin: field(lines, 'LinkedIn') || undefined,
    github: field(lines, 'GitHub') || undefined,
    website: field(lines, 'Website') || undefined,
  }
}

function parseSummaryType(sections: Section[]): 'objective' | 'professional' {
  const sec = firstSection(sections, 'SUMMARY')
  const raw = field(sec?.lines ?? [], 'Type').toLowerCase()
  return raw === 'objective' ? 'objective' : 'professional'
}

function parseSummaryContent(sections: Section[]): string {
  const sec = firstSection(sections, 'SUMMARY')
  return field(sec?.lines ?? [], 'Content')
}

function parseExperience(sections: Section[]): WorkExperience[] {
  return allSectionsNamed(sections, 'EXPERIENCE').map((sec) => ({
    id: nanoid(),
    company: field(sec.lines, 'Company'),
    title: field(sec.lines, 'Title'),
    startDate: field(sec.lines, 'Start'),
    endDate: field(sec.lines, 'End'),
    bullets: bullets(sec.lines),
  }))
}

function parseEducation(sections: Section[]): Education[] {
  return allSectionsNamed(sections, 'EDUCATION').map((sec) => ({
    id: nanoid(),
    school: field(sec.lines, 'School'),
    degree: field(sec.lines, 'Degree'),
    field: field(sec.lines, 'Field'),
    startDate: field(sec.lines, 'Start'),
    endDate: field(sec.lines, 'End'),
    gpa: field(sec.lines, 'GPA') || undefined,
  }))
}

function parseSkills(sections: Section[]): string[] {
  const sec = firstSection(sections, 'SKILLS')
  const raw = contentLines(sec?.lines ?? []).join(' ')
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function parseProjects(sections: Section[]): Project[] {
  return allSectionsNamed(sections, 'PROJECT').map((sec) => ({
    id: nanoid(),
    name: field(sec.lines, 'Name'),
    url: field(sec.lines, 'URL') || undefined,
    bullets: bullets(sec.lines),
  }))
}

function parseJobDescription(sections: Section[]): string | undefined {
  const sec = firstSection(sections, 'JOB DESCRIPTION')
  if (!sec) return undefined
  const text = contentLines(sec.lines).join('\n').trim()
  return text.length > 0 ? text : undefined
}
