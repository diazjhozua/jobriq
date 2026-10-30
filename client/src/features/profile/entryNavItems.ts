import type { Education, Project, WorkExperience } from '../../lib/types'

export type EntrySection = 'experience' | 'education' | 'projects'

export interface EntryNavItem {
  id: string
  entryId: string
  label: string
}

export function entryAnchorId(section: EntrySection, index: number) {
  return `profile-${section}-entry-${index + 1}`
}

function filled(...values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean)
}

function entryLabel(index: number, detail: string, fallback: string) {
  return detail ? `${index + 1} · ${detail}` : `${fallback} ${index + 1}`
}

export function experienceNavItems(
  entries: readonly WorkExperience[],
): EntryNavItem[] {
  return entries.map((entry, index) => ({
    id: entryAnchorId('experience', index),
    entryId: entry.id,
    label: entryLabel(
      index,
      filled(entry.company, entry.title).join(' — '),
      'Experience',
    ),
  }))
}

export function educationNavItems(entries: readonly Education[]): EntryNavItem[] {
  return entries.map((entry, index) => {
    const detail =
      entry.school.trim() || filled(entry.degree, entry.field).join(' ')

    return {
      id: entryAnchorId('education', index),
      entryId: entry.id,
      label: entryLabel(index, detail, 'Education'),
    }
  })
}

export function projectNavItems(entries: readonly Project[]): EntryNavItem[] {
  return entries.map((entry, index) => ({
    id: entryAnchorId('projects', index),
    entryId: entry.id,
    label: entryLabel(index, entry.name.trim(), 'Project'),
  }))
}
