import { describe, expect, it } from 'vitest'
import type {
  Certification,
  Education,
  Project,
  WorkExperience,
} from '../../lib/types'
import { allMissingSkills, missingSkillsGroups } from './skillsGained'

function experience(overrides: Partial<WorkExperience> = {}): WorkExperience {
  return {
    id: crypto.randomUUID(),
    company: '',
    title: '',
    startDate: '',
    endDate: '',
    bullets: [],
    skillsGained: [],
    ...overrides,
  }
}

function education(overrides: Partial<Education> = {}): Education {
  return {
    id: crypto.randomUUID(),
    school: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    gpa: '',
    skillsGained: [],
    ...overrides,
  }
}

function certification(
  overrides: Partial<Certification> = {},
): Certification {
  return {
    id: crypto.randomUUID(),
    name: '',
    issuingOrganization: '',
    issueDate: '',
    expirationDate: '',
    credentialId: '',
    credentialUrl: '',
    skillsGained: [],
    ...overrides,
  }
}

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: crypto.randomUUID(),
    name: '',
    url: '',
    startDate: '',
    endDate: '',
    associatedWith: '',
    description: '',
    bullets: [],
    skillsGained: [],
    ...overrides,
  }
}

describe('missingSkillsGroups', () => {
  it('groups missing skills by source entry in section order', () => {
    const groups = missingSkillsGroups(
      {
        experience: [
          experience({
            company: 'Acme',
            title: 'Engineer',
            skillsGained: ['Docker', 'React'],
          }),
        ],
        projects: [project({ name: 'Tool', skillsGained: ['Kafka'] })],
        education: [education({ school: 'State University', skillsGained: ['Algorithms'] })],
        certifications: [certification({ name: 'AWS', skillsGained: ['IAM'] })],
      },
      ['React'],
    )

    expect(groups.map((group) => group.label)).toEqual([
      'Work experience · 1 · Acme — Engineer',
      'Projects · 1 · Tool',
      'Education · 1 · State University',
      'Certifications · 1 · AWS',
    ])
    expect(groups.map((group) => group.skills)).toEqual([
      ['Docker'],
      ['Kafka'],
      ['Algorithms'],
      ['IAM'],
    ])
  })

  it('matches overall skills case-insensitively and omits empty groups', () => {
    const groups = missingSkillsGroups(
      {
        experience: [experience({ skillsGained: ['docker', 'React'] })],
        projects: [project({ skillsGained: ['react'] })],
        education: [],
        certifications: [],
      },
      ['Docker', 'REACT'],
    )

    expect(groups).toEqual([])
  })

  it('shows a skill only once, under the first source entry', () => {
    const groups = missingSkillsGroups(
      {
        experience: [experience({ company: 'Acme', skillsGained: ['Docker'] })],
        projects: [project({ name: 'Tool', skillsGained: ['docker'] })],
        education: [],
        certifications: [],
      },
      [],
    )

    expect(groups).toHaveLength(1)
    expect(groups[0]?.skills).toEqual(['Docker'])
  })

  it('falls back to the entry number when the entry is unnamed', () => {
    const groups = missingSkillsGroups(
      {
        experience: [experience({ skillsGained: ['Docker'] })],
        projects: [],
        education: [],
        certifications: [],
      },
      [],
    )

    expect(groups[0]?.label).toBe('Work experience · Experience 1')
  })
})

describe('allMissingSkills', () => {
  it('unions group skills without duplicates', () => {
    const groups = [
      { key: 'experience-1', label: 'Experience', skills: ['Docker', 'React'] },
      { key: 'projects-1', label: 'Projects', skills: ['react', 'Kafka'] },
    ]

    expect(allMissingSkills(groups)).toEqual(['Docker', 'React', 'Kafka'])
  })
})
