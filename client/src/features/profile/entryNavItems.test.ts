import { describe, expect, it } from 'vitest'
import type {
  Award,
  Certification,
  Education,
  Project,
  WorkExperience,
} from '../../lib/types'
import {
  awardNavItems,
  certificationNavItems,
  educationNavItems,
  entryAnchorId,
  experienceNavItems,
  projectNavItems,
} from './entryNavItems'

function experience(overrides: Partial<WorkExperience> = {}): WorkExperience {
  return {
    id: crypto.randomUUID(),
    company: '',
    title: '',
    startDate: '',
    endDate: '',
    bullets: [],
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
    bullets: [],
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
    ...overrides,
  }
}

function award(overrides: Partial<Award> = {}): Award {
  return {
    id: crypto.randomUUID(),
    title: '',
    associatedWith: '',
    issuer: '',
    issueDate: '',
    description: '',
    ...overrides,
  }
}

describe('entryAnchorId', () => {
  it('builds a stable index-based anchor', () => {
    expect(entryAnchorId('experience', 0)).toBe('profile-experience-entry-1')
    expect(entryAnchorId('education', 2)).toBe('profile-education-entry-3')
    expect(entryAnchorId('certifications', 0)).toBe(
      'profile-certifications-entry-1',
    )
    expect(entryAnchorId('awards', 1)).toBe('profile-awards-entry-2')
    expect(entryAnchorId('projects', 1)).toBe('profile-projects-entry-2')
  })
})

describe('experienceNavItems', () => {
  it('labels entries with the position and filled values', () => {
    const items = experienceNavItems([
      experience({ company: 'Acme', title: 'Engineer' }),
      experience({ company: 'Globex' }),
      experience({ title: 'Developer' }),
      experience(),
    ])

    expect(items.map((item) => item.label)).toEqual([
      '1 · Acme — Engineer',
      '2 · Globex',
      '3 · Developer',
      'Experience 4',
    ])
    expect(items[0]?.id).toBe('profile-experience-entry-1')
  })
})

describe('educationNavItems', () => {
  it('prefers the school and falls back to degree and field', () => {
    const items = educationNavItems([
      education({ school: 'State University' }),
      education({ degree: 'BSc', field: 'Computer Science' }),
      education(),
    ])

    expect(items.map((item) => item.label)).toEqual([
      '1 · State University',
      '2 · BSc Computer Science',
      'Education 3',
    ])
  })
})

describe('certificationNavItems', () => {
  it('uses the certification name and issuing organization', () => {
    const items = certificationNavItems([
      certification({
        name: 'AWS Solutions Architect',
        issuingOrganization: 'Amazon Web Services',
      }),
      certification({ name: 'Security+' }),
      certification(),
    ])

    expect(items.map((item) => item.label)).toEqual([
      '1 · AWS Solutions Architect — Amazon Web Services',
      '2 · Security+',
      'Certification 3',
    ])
    expect(items[0]?.id).toBe('profile-certifications-entry-1')
  })
})

describe('awardNavItems', () => {
  it('uses the award title and issuer', () => {
    const items = awardNavItems([
      award({ title: 'Engineer of the Year', issuer: 'IEEE' }),
      award({ title: 'Hackathon winner' }),
      award(),
    ])

    expect(items.map((item) => item.label)).toEqual([
      '1 · Engineer of the Year — IEEE',
      '2 · Hackathon winner',
      'Award 3',
    ])
    expect(items[0]?.id).toBe('profile-awards-entry-1')
  })
})

describe('projectNavItems', () => {
  it('uses the project name and falls back to a position label', () => {
    const items = projectNavItems([
      project({ name: 'Jobriq' }),
      project(),
    ])

    expect(items.map((item) => item.label)).toEqual(['1 · Jobriq', 'Project 2'])
  })

  it('includes the associated company in the label', () => {
    const items = projectNavItems([
      project({ name: 'Jobriq', associatedWith: 'Acme' }),
      project({ associatedWith: 'Personal Project' }),
    ])

    expect(items.map((item) => item.label)).toEqual([
      '1 · Jobriq — Acme',
      '2 · Personal Project',
    ])
  })
})
