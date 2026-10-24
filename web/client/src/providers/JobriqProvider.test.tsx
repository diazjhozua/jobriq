import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createEmptyState } from '../lib/defaults'
import { saveState, STORAGE_KEY } from '../lib/storage'
import type { GeneratedResume, JobriqState } from '../lib/types'
import { JobriqProvider, useJobriq } from './JobriqProvider'

const application = {
  id: 'app-1',
  company: 'Acme',
  role: 'Engineer',
  jobDescription: 'Build things.',
  status: 'saved' as const,
  createdAt: '2026-10-24T12:00:00.000Z',
  generatedResume: null,
}

function Harness() {
  const {
    profile,
    applications,
    storageError,
    saveProfile,
    addApplication,
    updateApplicationStatus,
    deleteApplication,
    saveGeneratedResume,
  } = useJobriq()

  const resume: GeneratedResume = {
    personal: profile.personal,
    summary: 'Generated.',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    keywords: null,
    generatedAt: '2026-10-24T12:00:00.000Z',
  }

  return (
    <div>
      <p data-testid="profile-name">{profile.personal.name}</p>
      <p data-testid="applications">{JSON.stringify(applications)}</p>
      <p data-testid="storage-error">{storageError ?? ''}</p>
      <button
        onClick={() =>
          saveProfile({
            ...profile,
            personal: { ...profile.personal, name: 'Jane Doe' },
          })
        }
      >
        Save profile
      </button>
      <button
        onClick={() =>
          addApplication({
            company: '  Globex  ',
            role: '  Developer  ',
            jobDescription: '  Write code.  ',
            status: 'applied',
          })
        }
      >
        Add application
      </button>
      <button onClick={() => updateApplicationStatus('app-1', 'offer')}>
        Update status
      </button>
      <button onClick={() => deleteApplication('app-1')}>Delete application</button>
      <button onClick={() => saveGeneratedResume('app-1', resume)}>Save resume</button>
    </div>
  )
}

function renderHarness() {
  return render(
    <JobriqProvider>
      <Harness />
    </JobriqProvider>,
  )
}

function storedState(): JobriqState {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as JobriqState
}

function stateWithApplication(): JobriqState {
  const state = createEmptyState()
  state.profile.personal.name = 'Jane Doe'
  state.profile.personal.email = 'jane@example.com'
  state.applications.push(application)
  return state
}

describe('JobriqProvider', () => {
  it('hydrates the saved profile', () => {
    const state = createEmptyState()
    state.profile.personal.name = 'Hydrated Name'
    saveState(state)

    renderHarness()

    expect(screen.getByTestId('profile-name')).toHaveTextContent('Hydrated Name')
  })

  it('saves the profile on demand', async () => {
    const user = userEvent.setup()
    renderHarness()

    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(() => {
      expect(storedState().profile.personal.name).toBe('Jane Doe')
    })
  })

  it('adds an application with trimmed fields at the top', async () => {
    const user = userEvent.setup()
    saveState(stateWithApplication())
    renderHarness()

    await user.click(screen.getByRole('button', { name: 'Add application' }))

    await waitFor(() => {
      expect(storedState().applications).toHaveLength(2)
    })
    const added = storedState().applications[0]
    expect(added.company).toBe('Globex')
    expect(added.role).toBe('Developer')
    expect(added.jobDescription).toBe('Write code.')
    expect(added.status).toBe('applied')
    expect(added.id).not.toBe('')
  })

  it('updates an application status', async () => {
    const user = userEvent.setup()
    saveState(stateWithApplication())
    renderHarness()

    await user.click(screen.getByRole('button', { name: 'Update status' }))

    await waitFor(() => {
      expect(storedState().applications[0]?.status).toBe('offer')
    })
  })

  it('deletes an application', async () => {
    const user = userEvent.setup()
    saveState(stateWithApplication())
    renderHarness()

    await user.click(screen.getByRole('button', { name: 'Delete application' }))

    await waitFor(() => {
      expect(storedState().applications).toHaveLength(0)
    })
  })

  it('stores a generated resume on its application', async () => {
    const user = userEvent.setup()
    saveState(stateWithApplication())
    renderHarness()

    await user.click(screen.getByRole('button', { name: 'Save resume' }))

    await waitFor(() => {
      expect(storedState().applications[0]?.generatedResume?.summary).toBe('Generated.')
    })
  })

  it('surfaces a storage write failure', async () => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new Error('quota exceeded')
    }

    try {
      renderHarness()

      expect(await screen.findByTestId('storage-error')).toHaveTextContent(
        'Changes could not be saved to this browser.',
      )
    } finally {
      Storage.prototype.setItem = original
    }
  })
})
