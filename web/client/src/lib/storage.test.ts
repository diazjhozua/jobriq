import { describe, expect, it } from 'vitest'
import { createEmptyState } from './defaults'
import { loadState, saveState, STORAGE_KEY } from './storage'

describe('storage', () => {
  it('returns an empty state when nothing is stored', () => {
    expect(loadState()).toEqual(createEmptyState())
  })

  it('round-trips a saved state', () => {
    const state = createEmptyState()
    state.profile.personal.name = 'Jane Doe'
    state.profile.personal.email = 'jane@example.com'
    state.profile.skills = ['C#', 'React']
    state.applications.push({
      id: '1',
      company: 'Acme',
      role: 'Engineer',
      jobDescription: 'Build things.',
      status: 'applied',
      createdAt: '2026-10-24T12:00:00.000Z',
      generatedResume: null,
    })

    expect(saveState(state)).toBe(true)
    expect(loadState()).toEqual(state)
  })

  it('falls back to an empty state for malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')

    expect(loadState()).toEqual(createEmptyState())
  })

  it('falls back to an empty state for schema-invalid data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, profile: {} }))

    expect(loadState()).toEqual(createEmptyState())
  })

  it('reports a failed write', () => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new Error('quota exceeded')
    }

    try {
      expect(saveState(createEmptyState())).toBe(false)
    } finally {
      Storage.prototype.setItem = original
    }
  })
})
