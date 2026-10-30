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
  appliedDate: '',
  generatedResume: null,
}

function Harness() {
  const {
    profile,
    applications,
    standaloneResume,
    status,
    loadError,
    syncError,
    retry,
    saveProfile,
    addApplication,
    updateApplication,
    updateApplicationStatus,
    deleteApplication,
    saveGeneratedResume,
    generateStandaloneResume,
    review,
    reviewedAt,
    reviewing,
    reviewError,
    reviewProfile,
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
      <p data-testid="review">{JSON.stringify(review)}</p>
      <p data-testid="reviewed-at">{reviewedAt ?? ''}</p>
      <p data-testid="reviewing">{String(reviewing)}</p>
      <p data-testid="review-error">{reviewError ?? ''}</p>
      <p data-testid="profile-name">{profile.personal.name}</p>
      <p data-testid="applications">{JSON.stringify(applications)}</p>
      <p data-testid="standalone-resume">{JSON.stringify(standaloneResume)}</p>
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
          void updateApplication('app-1', {
            company: '  Globex  ',
            role: '  Developer  ',
            appliedDate: 'Aug 2022',
          }).catch(() => {})
        }
      >
        Update details
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
      <button
        onClick={() =>
          void generateStandaloneResume(profile, '  Build things.  ').catch(
            () => {},
          )
        }
      >
        Generate standalone
      </button>
      <button onClick={() => void reviewProfile(profile)}>Run review</button>
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

  it('updates application details', async () => {
    const user = userEvent.setup()
    const api = installMockApi({ state: stateWithApplication() })
    renderHarness()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: 'Update details' }))

    await waitFor(() => {
      expect(api.state.applications[0]).toMatchObject({
        company: 'Globex',
        role: 'Developer',
        appliedDate: '2022-08-01',
      })
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

  it('stores a generated standalone resume', async () => {
    const user = userEvent.setup()
    const api = installMockApi({ state: stateWithApplication() })
    renderHarness()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: 'Generate standalone' }))

    await waitFor(() => {
      expect(screen.getByTestId('standalone-resume')).toHaveTextContent(
        'Generated summary.',
      )
    })
    expect(api.state.standaloneResume?.summary).toBe('Generated summary.')
    expect(api.calls.find((call) => call.path === '/api/profile/resume')?.body)
      .toMatchObject({ jobDescription: 'Build things.' })
  })

  it('rethrows a standalone failure and leaves the state unchanged', async () => {
    const user = userEvent.setup()
    installMockApi({
      state: stateWithApplication(),
      fail: {
        standalone: {
          status: 503,
          detail: 'OpenAI is unavailable.',
          code: 'missing_api_key',
        },
      },
    })
    renderHarness()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: 'Generate standalone' }))

    await waitFor(() => {
      expect(screen.getByTestId('sync-error')).toHaveTextContent(
        'OpenAI is unavailable.',
      )
    })
    expect(screen.getByTestId('standalone-resume')).toHaveTextContent('null')
  })

  it('stores a review and its timestamp without touching the sync error', async () => {
    const user = userEvent.setup()
    installMockApi()
    renderHarness()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: 'Run review' }))

    await waitFor(() => {
      expect(screen.getByTestId('review')).toHaveTextContent(
        'Deterministic reviewed summary.',
      )
    })
    expect(screen.getByTestId('reviewed-at')).not.toBeEmptyDOMElement()
    expect(screen.getByTestId('sync-error')).toBeEmptyDOMElement()
  })

  it('keeps review failures inside the panel state', async () => {
    const user = userEvent.setup()
    installMockApi({
      fail: {
        review: {
          status: 503,
          detail: 'OpenAI is unavailable.',
          code: 'openai_rate_limited',
        },
      },
    })
    renderHarness()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: 'Run review' }))

    await waitFor(() => {
      expect(screen.getByTestId('review-error')).toHaveTextContent(
        'OpenAI is unavailable.',
      )
    })
    expect(screen.getByTestId('sync-error')).toBeEmptyDOMElement()
  })

  it('keeps the previous review when a rerun fails', async () => {
    const user = userEvent.setup()
    const api = installMockApi()
    renderHarness()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: 'Run review' }))
    await waitFor(() => {
      expect(screen.getByTestId('review')).toHaveTextContent(
        'Deterministic reviewed summary.',
      )
    })

    api.fail.review = {
      status: 503,
      detail: 'OpenAI is unavailable.',
      code: 'openai_rate_limited',
    }
    await user.click(screen.getByRole('button', { name: 'Run review' }))

    await waitFor(() => {
      expect(screen.getByTestId('review-error')).toHaveTextContent(
        'OpenAI is unavailable.',
      )
    })
    expect(screen.getByTestId('review')).toHaveTextContent(
      'Deterministic reviewed summary.',
    )
  })

  it('toggles the reviewing flag while a review is in flight', async () => {
    const user = userEvent.setup()
    let release!: () => void
    const reviewGate = new Promise<void>((resolve) => {
      release = resolve
    })
    installMockApi({ reviewGate })
    renderHarness()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: 'Run review' }))
    expect(screen.getByTestId('reviewing')).toHaveTextContent('true')

    release()
    await waitFor(() => {
      expect(screen.getByTestId('reviewing')).toHaveTextContent('false')
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
