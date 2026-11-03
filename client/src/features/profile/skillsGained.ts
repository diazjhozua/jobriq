import type { Profile } from '../../lib/types'
import { uniqueSkills } from '../../lib/utils'
import {
  certificationNavItems,
  educationNavItems,
  experienceNavItems,
  projectNavItems,
  type EntryNavItem,
} from './entryNavItems'

export interface SkillsGainedGroup {
  key: string
  label: string
  skills: string[]
}

type SkillSources = Pick<
  Profile,
  'experience' | 'education' | 'certifications' | 'projects'
>

function groupLabel(sectionLabel: string, navLabel: string) {
  return `${sectionLabel} · ${navLabel}`
}

function addGroups(
  groups: SkillsGainedGroup[],
  sectionLabel: string,
  sectionKey: string,
  entries: readonly { id: string; skillsGained: string[] }[],
  navItems: readonly EntryNavItem[],
  known: Set<string>,
  claimed: Set<string>,
) {
  entries.forEach((entry, index) => {
    const skills = uniqueSkills(entry.skillsGained ?? []).filter((skill) => {
      const key = skill.toLowerCase()
      if (known.has(key) || claimed.has(key)) {
        return false
      }

      claimed.add(key)
      return true
    })

    if (skills.length === 0) {
      return
    }

    groups.push({
      key: `${sectionKey}-${entry.id}`,
      label: groupLabel(sectionLabel, navItems[index]?.label ?? sectionLabel),
      skills,
    })
  })
}

export function missingSkillsGroups(
  profile: SkillSources,
  overallSkills: readonly string[],
): SkillsGainedGroup[] {
  const known = new Set(
    uniqueSkills(overallSkills).map((skill) => skill.toLowerCase()),
  )
  const claimed = new Set<string>()
  const groups: SkillsGainedGroup[] = []

  addGroups(
    groups,
    'Work experience',
    'experience',
    profile.experience,
    experienceNavItems(profile.experience),
    known,
    claimed,
  )
  addGroups(
    groups,
    'Projects',
    'projects',
    profile.projects,
    projectNavItems(profile.projects),
    known,
    claimed,
  )
  addGroups(
    groups,
    'Education',
    'education',
    profile.education,
    educationNavItems(profile.education),
    known,
    claimed,
  )
  addGroups(
    groups,
    'Certifications',
    'certifications',
    profile.certifications,
    certificationNavItems(profile.certifications),
    known,
    claimed,
  )

  return groups
}

export function allMissingSkills(groups: readonly SkillsGainedGroup[]): string[] {
  return uniqueSkills(groups.flatMap((group) => group.skills))
}
