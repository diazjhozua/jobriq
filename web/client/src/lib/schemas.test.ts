import { describe, expect, it } from 'vitest'
import {
  applicationFormSchema,
  generatedResumeSchema,
  profileSchema,
  stateSchema,
} from './schemas'
import { createEmptyProfile, createEmptyState } from './defaults'

describe('profileSchema', () => {
  it('requires a name and a valid email', () => {
    const result = profileSchema.safeParse(createEmptyProfile())

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining(['Name is required', 'Enter a valid email address']),
    )
  })

  it('accepts blank optional URLs', () => {
    const profile = createEmptyProfile()
    profile.personal.name = 'Jane Doe'
    profile.personal.email = 'jane@example.com'

    expect(profileSchema.safeParse(profile).success).toBe(true)
  })

  it('rejects malformed optional URLs', () => {
    const profile = createEmptyProfile()
    profile.personal.name = 'Jane Doe'
    profile.personal.email = 'jane@example.com'
    profile.personal.website = 'not a url'

    const result = profileSchema.safeParse(profile)

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Enter a valid website URL')
  })
})

describe('applicationFormSchema', () => {
  it('requires company, role, and job description', () => {
    const result = applicationFormSchema.safeParse({
      company: '  ',
      role: '',
      jobDescription: '',
      status: 'saved',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(3)
  })

  it('accepts a complete application', () => {
    const result = applicationFormSchema.safeParse({
      company: 'Acme',
      role: 'Engineer',
      jobDescription: 'Build things.',
      status: 'applied',
    })

    expect(result.success).toBe(true)
  })
})

describe('stateSchema', () => {
  it('accepts an empty state', () => {
    expect(stateSchema.safeParse(createEmptyState()).success).toBe(true)
  })

  it('rejects unknown storage versions', () => {
    expect(
      stateSchema.safeParse({ ...createEmptyState(), version: 2 }).success,
    ).toBe(false)
  })

  it('accepts an application with a stored generated resume', () => {
    const state = createEmptyState()
    state.profile.personal.name = 'Jane Doe'
    state.profile.personal.email = 'jane@example.com'
    state.applications.push({
      id: '1',
      company: 'Acme',
      role: 'Engineer',
      jobDescription: 'Build things.',
      status: 'offer',
      createdAt: '2026-10-24T12:00:00.000Z',
      generatedResume: {
        personal: state.profile.personal,
        summary: 'Summary.',
        experience: [],
        education: [],
        skills: [],
        projects: [],
        keywords: null,
        generatedAt: '2026-10-24T12:00:00.000Z',
      },
    })

    expect(stateSchema.safeParse(state).success).toBe(true)
  })
})

describe('generatedResumeSchema', () => {
  it('accepts a resume with keywords', () => {
    const resume = {
      personal: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        website: '',
      },
      summary: 'Summary.',
      experience: [],
      education: [],
      skills: ['C#'],
      projects: [],
      keywords: { matched: ['C#'], missing: ['Kubernetes'] },
      generatedAt: '2026-10-24T12:00:00.000Z',
    }

    expect(generatedResumeSchema.safeParse(resume).success).toBe(true)
  })
})
