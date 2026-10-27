import { describe, expect, it, vi } from 'vitest'
import { installMockApi } from '../test/mockApi'
import {
  createApplication,
  deleteApplication,
  fetchState,
  reviewProfile,
  saveGeneratedResume,
  saveProfile,
  updateApplicationStatus,
} from './api'
import { createEmptyProfile, createEmptyState } from './defaults'
import type { GeneratedResume } from './types'

const generated: GeneratedResume = {
  personal: createEmptyProfile().personal,
  summary: 'Tailored summary.',
  experience: [],
  education: [],
  skills: ['C#'],
  projects: [],
  keywords: null,
  generatedAt: '2026-10-24T12:00:00.000Z',
}

describe('api', () => {
  it('loads the workspace state', async () => {
    const api = installMockApi()

    const state = await fetchState()

    expect(state).toEqual(createEmptyState())
    expect(api.calls[0]).toMatchObject({ method: 'GET', path: '/api/state' })
  })

  it('saves the profile through the API', async () => {
    const api = installMockApi()
    const profile = createEmptyProfile()
    profile.personal.name = 'Jane Doe'
    profile.personal.email = 'jane@example.com'

    const saved = await saveProfile(profile)

    expect(saved.personal.name).toBe('Jane Doe')
    expect(api.state.profile.personal.name).toBe('Jane Doe')
    expect(api.calls[0]).toMatchObject({
      method: 'PUT',
      path: '/api/profile',
      body: { profile: { personal: { name: 'Jane Doe' } } },
    })
  })

  it('requests a profile review with the submitted profile', async () => {
    const api = installMockApi()
    const profile = createEmptyProfile()
    profile.personal.name = 'Jane Doe'
    profile.personal.email = 'jane@example.com'
    profile.experience = [
      {
        id: 'experience-1',
        company: 'Acme',
        title: 'Engineer',
        startDate: '2022',
        endDate: 'Present',
        bullets: ['Built a thing'],
      },
    ]

    const review = await reviewProfile(profile)

    expect(review.suggestions).toHaveLength(3)
    expect(review.suggestions[1]).toMatchObject({
      section: 'experience',
      itemId: 'experience-1',
      originalText: 'Built a thing',
      proposedText: 'Reviewed: Built a thing',
    })
    expect(api.calls[0]).toMatchObject({
      method: 'POST',
      path: '/api/profile/review',
      body: { profile: { experience: [{ bullets: ['Built a thing'] }] } },
    })
  })

  it('maps review failures to an ApiError', async () => {
    installMockApi({
      fail: {
        review: {
          status: 503,
          detail: 'OpenAI is unavailable.',
          code: 'openai_rate_limited',
        },
      },
    })

    await expect(reviewProfile(createEmptyProfile())).rejects.toMatchObject({
      status: 503,
      code: 'openai_rate_limited',
      message: 'OpenAI is unavailable.',
    })
  })

  it('rejects a malformed review response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ suggestions: [{ section: 'hobbies' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(reviewProfile(createEmptyProfile())).rejects.toMatchObject({
      status: 200,
      code: 'invalid_response',
    })
  })

  it('creates an application and returns the server copy', async () => {
    const api = installMockApi()

    const application = await createApplication({
      company: 'Acme',
      role: 'Engineer',
      jobDescription: 'Build things.',
      status: 'applied',
    })

    expect(application.id).not.toBe('')
    expect(application.status).toBe('applied')
    expect(api.state.applications).toHaveLength(1)
  })

  it('updates a status and deletes an application', async () => {
    const api = installMockApi()
    const application = await createApplication({
      company: 'Acme',
      role: 'Engineer',
      jobDescription: 'Build things.',
      status: 'saved',
    })

    const updated = await updateApplicationStatus(application.id, 'interviewing')
    expect(updated.status).toBe('interviewing')

    await deleteApplication(application.id)
    expect(api.state.applications).toHaveLength(0)
  })

  it('stores a generated resume on the application', async () => {
    const api = installMockApi()
    const application = await createApplication({
      company: 'Acme',
      role: 'Engineer',
      jobDescription: 'Build things.',
      status: 'saved',
    })

    const updated = await saveGeneratedResume(application.id, generated)

    expect(updated.generatedResume?.summary).toBe('Tailored summary.')
    expect(api.state.applications[0]?.generatedResume?.summary).toBe(
      'Tailored summary.',
    )
  })

  it('maps ProblemDetails to an ApiError', async () => {
    installMockApi({
      fail: {
        state: {
          status: 503,
          detail: 'The database is unavailable.',
          code: 'database_unavailable',
        },
      },
    })

    await expect(fetchState()).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      code: 'database_unavailable',
      message: 'The database is unavailable.',
    })
  })

  it('rejects an unexpected response shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ profile: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(fetchState()).rejects.toMatchObject({
      status: 200,
      code: 'invalid_response',
    })
  })
})
