import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createEmptyState } from '../lib/defaults'
import { installMockApi } from '../test/mockApi'
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
    status,
    loadError,
    syncError,
    retry,
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
      <p data-testid="status">{status}</p>
      <p data-testid="load-error">{loadError ?? ''}</p>
      <p data-testid="sync-error">{syncError ?? ''}</p>
      <p data-testid="profile-name">{profile.personal.name}</p>
      <p data-testid="applications">{JSON.stringify(applications)}</p>
      <button onClick={retry}>Retry</button>
      <button
        onClick={() =>
          void saveProfile({
            ...profile,
            personal: { ...profile.personal, name: 'Jane Doe' },
          }).catch(() => {})
        }
      >
        Save profile
      </button>
      <button
        onClick={() =>
          void addApplication({
            company: '  Globex  ',
            role: '  Developer  ',
            jobDescription: '  Write code.  ',
            status: 'applied',
          }).catch(() => {})
        }
      >
        Add application
      </button>
      <button
        onClick={() =>
          void updateApplicationStatus('app-1', 'offer').catch(() => {})
        }
      >
        Update status
      </button>
      <button
        onClick={() => void deleteApplication('app-1').catch(() => {})}
      >
        Delete application
      </button>
      <button
        onClick={() =>
          void saveGeneratedResume('app-1', resume).catch(() => {})
        }
      >
        Save resume
      </button>
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

async function waitForReady() {
  await waitFor(() => {
    expect(screen.getByTestId('status')).toHaveTextContent('ready')
  })
}

function stateWithApplication(): JobriqState {
  const state = createEmptyState()
  state.profile.personal.name = 'Jane Doe'
  state.profile.personal.email = 'jane@example.com'
  state.applications.push(application)
  return state
}

describe('JobriqProvider', () => {
  it('hydrates the saved profile', async () => {
    const state = createEmptyState()
    state.profile.personal.name = 'Hydrated Name'
    installMockApi({ state })

    renderHarness()
    await waitForReady()

    expect(screen.getByTestId('profile-name')).toHaveTextContent('Hydrated Name')
  })

  it('saves the profile on demand', async () => {
    const user = userEvent.setup()
    const api = installMockApi()
    renderHarness()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(() => {
      expect(api.state.profile.personal.name).toBe('Jane Doe')
    })
  })

  it('adds an application with trimmed fields at the top', async () => {
    const user = userEvent.setup()
    const api = installMockApi({ state: stateWithApplication() })
    renderHarness()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: 'Add application' }))

    await waitFor(() => {
      expect(api.state.applications).toHaveLength(2)
    })
    const added = api.state.applications[0]
    expect(added.company).toBe('Globex')
    expect(added.role).toBe('Developer')
    expect(added.jobDescription).toBe('Write code.')
    expect(added.status).toBe('applied')
    expect(added.id).not.toBe('')
  })

  it('updates an application status', async () => {
    const user = userEvent.setup()
    const api = installMockApi({ state: stateWithApplication() })
    renderHarness()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: 'Update status' }))

    await waitFor(() => {
      expect(api.state.applications[0]?.status).toBe('offer')
    })
  })

  it('deletes an application', async () => {
    const user = userEvent.setup()
    const api = installMockApi({ state: stateWithApplication() })
    renderHarness()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: 'Delete application' }))

    await waitFor(() => {
      expect(api.state.applications).toHaveLength(0)
    })
  })

  it('stores a generated resume on its application', async () => {
    const user = userEvent.setup()
    const api = installMockApi({ state: stateWithApplication() })
    renderHarness()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: 'Save resume' }))

    await waitFor(() => {
      expect(api.state.applications[0]?.generatedResume?.summary).toBe('Generated.')
    })
  })

  it('shows a retry panel when hydration fails and retries on demand', async () => {
    const user = userEvent.setup()
    const api = installMockApi({
      fail: {
        state: {
          status: 503,
          detail: 'The database is unavailable.',
          code: 'database_unavailable',
        },
      },
    })
    renderHarness()

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error')
    })
    expect(screen.getByTestId('load-error')).toHaveTextContent(
      'The database is unavailable.',
    )

    api.fail.state = undefined
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    await waitForReady()
  })

  it('rolls back an optimistic status change when the request fails', async () => {
    const user = userEvent.setup()
    const api = installMockApi({
      state: stateWithApplication(),
      fail: {
        status: {
          status: 503,
          detail: 'The status could not be saved.',
          code: 'database_unavailable',
        },
      },
    })
    renderHarness()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: 'Update status' }))

    await waitFor(() => {
      expect(screen.getByTestId('sync-error')).toHaveTextContent(
        'The status could not be saved.',
      )
    })
    expect(screen.getByTestId('applications')).toHaveTextContent('"status":"saved"')
    expect(api.state.applications[0]?.status).toBe('saved')
  })

  it('restores an application when deletion fails', async () => {
    const user = userEvent.setup()
    const api = installMockApi({
      state: stateWithApplication(),
      fail: {
        delete: {
          status: 503,
          detail: 'The application could not be deleted.',
          code: 'database_unavailable',
        },
      },
    })
    renderHarness()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: 'Delete application' }))

    await waitFor(() => {
      expect(screen.getByTestId('sync-error')).toHaveTextContent(
        'The application could not be deleted.',
      )
    })
    expect(screen.getByTestId('applications')).toHaveTextContent('Acme')
    expect(api.state.applications).toHaveLength(1)
  })
})
