import { describe, expect, it } from 'vitest'
import {
  apiStateSchema,
  applicationFormSchema,
  generatedResumeSchema,
  profileReviewSchema,
  profileSchema,
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

describe('apiStateSchema', () => {
  it('accepts an empty state', () => {
    expect(apiStateSchema.safeParse(createEmptyState()).success).toBe(true)
  })

  it('normalizes null optional values returned by the API', () => {
    const profile = createEmptyProfile()
    const parsed = apiStateSchema.parse({
      profile: {
        ...profile,
        personal: {
          ...profile.personal,
          linkedin: null,
          github: null,
          website: null,
        },
        education: [
          {
            id: 'education-1',
            school: 'State University',
            degree: 'BSc',
            field: 'Computer Science',
            startDate: '2018',
            endDate: '2022',
            gpa: null,
          },
        ],
        projects: [
          {
            id: 'project-1',
            name: 'Jobriq',
            url: null,
            bullets: [],
          },
        ],
      },
      applications: [],
    })

    expect(parsed.profile.personal.linkedin).toBe('')
    expect(parsed.profile.personal.github).toBe('')
    expect(parsed.profile.personal.website).toBe('')
    expect(parsed.profile.education[0]?.gpa).toBe('')
    expect(parsed.profile.projects[0]?.url).toBe('')
    expect(parsed.profile.projects[0]?.startDate).toBe('')
    expect(parsed.profile.projects[0]?.endDate).toBe('')
    expect(parsed.profile.projects[0]?.associatedWith).toBe('')
  })

  it('defaults a missing standalone resume to null', () => {
    const { standaloneResume: _omitted, ...state } = createEmptyState()

    const parsed = apiStateSchema.parse(state)

    expect(parsed.standaloneResume).toBeNull()
  })

  it('accepts a stored standalone resume', () => {
    const state = createEmptyState()
    state.standaloneResume = {
      personal: state.profile.personal,
      summary: 'Standalone summary.',
      experience: [],
      education: [],
      skills: [],
      projects: [],
      keywords: null,
      generatedAt: '2026-10-24T12:00:00.000Z',
    }

    expect(apiStateSchema.safeParse(state).success).toBe(true)
  })

  it('accepts an application with a stored cover letter', () => {
    const state = createEmptyState()
    state.profile.personal.name = 'Jane Doe'
    state.profile.personal.email = 'jane@example.com'
    state.applications.push({
      id: '1',
      company: 'Acme',
      role: 'Engineer',
      jobDescription: 'Build things.',
      status: 'applied',
      createdAt: '2026-10-24T12:00:00.000Z',
      appliedDate: '',
      coverLetter: {
        personal: state.profile.personal,
        company: 'Acme',
        role: 'Engineer',
        salutation: 'Dear Acme Hiring Team,',
        paragraphs: ['First paragraph.', 'Second paragraph.'],
        closing: 'Sincerely,',
        signature: 'Jane Doe',
        generatedAt: '2026-10-24T12:00:00.000Z',
      },
    })

    const parsed = apiStateSchema.parse(state)

    expect(parsed.applications[0]?.coverLetter?.paragraphs).toHaveLength(2)
  })

  it('normalizes null cover letter fields', () => {
    const profile = createEmptyProfile()
    const parsed = apiStateSchema.parse({
      profile,
      applications: [
        {
          id: '1',
          company: 'Acme',
          role: 'Engineer',
          jobDescription: 'Build things.',
          status: 'applied',
          createdAt: '2026-10-24T12:00:00.000Z',
          coverLetter: {
            personal: profile.personal,
            company: 'Acme',
            role: 'Engineer',
            salutation: null,
            paragraphs: null,
            closing: null,
            signature: null,
            generatedAt: '2026-10-24T12:00:00.000Z',
          },
        },
      ],
      standaloneResume: null,
    })

    expect(parsed.applications[0]?.coverLetter).toMatchObject({
      salutation: '',
      paragraphs: [],
      closing: '',
      signature: '',
    })
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
      appliedDate: '',
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

    expect(apiStateSchema.safeParse(state).success).toBe(true)
  })
})

describe('profileReviewSchema', () => {
  const suggestion = {
    id: 'suggestion-1',
    section: 'experience',
    itemId: 'experience-1',
    bulletIndex: 0,
    category: 'impact',
    title: 'Quantify impact',
    detail: 'Add a number.',
    originalText: 'Built a thing',
    proposedText: 'Built a thing used by 100 people.',
  }

  it('accepts a review payload', () => {
    const result = profileReviewSchema.safeParse({ suggestions: [suggestion] })

    expect(result.success).toBe(true)
    expect(result.data?.suggestions[0]?.section).toBe('experience')
  })

  it('normalizes null optional values', () => {
    const parsed = profileReviewSchema.parse({
      suggestions: [
        {
          ...suggestion,
          itemId: null,
          bulletIndex: null,
          originalText: null,
          proposedText: null,
          detail: null,
        },
      ],
    })

    expect(parsed.suggestions[0]).toMatchObject({
      itemId: null,
      bulletIndex: null,
      originalText: null,
      proposedText: null,
      detail: '',
    })
  })

  it('rejects an unknown section', () => {
    const result = profileReviewSchema.safeParse({
      suggestions: [{ ...suggestion, section: 'hobbies' }],
    })

    expect(result.success).toBe(false)
  })

  it('falls back to clarity for an unknown category', () => {
    const parsed = profileReviewSchema.parse({
      suggestions: [{ ...suggestion, category: 'style' }],
    })

    expect(parsed.suggestions[0]?.category).toBe('clarity')
  })

  it('rejects a negative bullet index', () => {
    const result = profileReviewSchema.safeParse({
      suggestions: [{ ...suggestion, bulletIndex: -1 }],
    })

    expect(result.success).toBe(false)
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
