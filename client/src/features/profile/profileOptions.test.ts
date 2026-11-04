import { describe, expect, it } from 'vitest'
import type { Award, Certification, Education, WorkExperience } from '../../lib/types'
import {
  awardAssociationOptions,
  companyOptions,
  issuerOptions,
  PERSONAL_PROJECT,
  projectAssociationOptions,
  schoolOptions,
} from './profileOptions'

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

describe('company and school options', () => {
  it('derives companies in order', () => {
    expect(
      companyOptions([
        experience({ company: 'Acme' }),
        experience({ company: 'Globex' }),
        experience({ company: 'ACME' }),
      ]),
    ).toEqual(['Acme', 'Globex'])
  })

  it('uses the school name only', () => {
    expect(
      schoolOptions([
        education({ school: 'State University', degree: 'BS Computer Science' }),
      ]),
    ).toEqual(['State University'])
  })
})

describe('projectAssociationOptions', () => {
  it('lists companies, then schools, then Personal Project', () => {
    expect(
      projectAssociationOptions({
        experience: [experience({ company: 'Acme' })],
        education: [education({ school: 'State University' })],
      }),
    ).toEqual(['Acme', 'State University', PERSONAL_PROJECT])
  })

  it('does not repeat Personal Project when an entry already uses that name', () => {
    expect(
      projectAssociationOptions({
        experience: [experience({ company: 'personal project' })],
        education: [],
      }),
    ).toEqual(['personal project'])
  })

  it('returns only Personal Project for an empty profile', () => {
    expect(projectAssociationOptions({ experience: [], education: [] })).toEqual([
      PERSONAL_PROJECT,
    ])
  })
})

describe('awardAssociationOptions', () => {
  it('lists companies and schools without Personal Project', () => {
    expect(
      awardAssociationOptions({
        experience: [experience({ company: 'Acme' })],
        education: [education({ school: 'State University' })],
      }),
    ).toEqual(['Acme', 'State University'])
  })
})

describe('issuerOptions', () => {
  it('pools companies, schools, certifications, and awards, deduped case-insensitively', () => {
    expect(
      issuerOptions({
        experience: [experience({ company: 'Acme' })],
        education: [education({ school: 'State University' })],
        certifications: [
          certification({ issuingOrganization: 'Amazon Web Services' }),
          certification({ issuingOrganization: 'IEEE' }),
        ],
        awards: [award({ issuer: 'ieee' }), award({ issuer: 'ACM' })],
      }),
    ).toEqual([
      'Acme',
      'State University',
      'Amazon Web Services',
      'IEEE',
      'ACM',
    ])
  })

  it('returns an empty list for an empty profile', () => {
    expect(
      issuerOptions({
        experience: [],
        education: [],
        certifications: [],
        awards: [],
      }),
    ).toEqual([])
  })
})
