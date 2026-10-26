import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createEmptyState } from '../../lib/defaults'
import { installMockApi } from '../../test/mockApi'
import type { GeneratedResume, JobriqState } from '../../lib/types'
import { JobriqProvider, useJobriq } from '../../providers/JobriqProvider'
import { ApplicationsPage } from './ApplicationsPage'

const application = {
  id: 'app-1',
  company: 'Acme',
  role: 'Engineer',
  jobDescription: 'Build reliable systems.',
  status: 'saved' as const,
  createdAt: '2026-10-24T12:00:00.000Z',
  generatedResume: null,
}

const generated: GeneratedResume = {
  personal: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
  },
  summary: 'Tailored summary.',
  experience: [],
  education: [],
  skills: ['C#'],
  projects: [],
  keywords: { matched: ['C#'], missing: ['Kubernetes'] },
  generatedAt: '2026-10-24T12:00:00.000Z',
}

function stateWithApplication(): JobriqState {
  const state = createEmptyState()
  state.profile.personal.name = 'Jane Doe'
  state.profile.personal.email = 'jane@example.com'
  state.applications.push(application)
  return state
}

function ReadyPage() {
  const { status } = useJobriq()

  if (status !== 'ready') {
    return <p>Loading</p>
  }

  return <ApplicationsPage />
}

async function renderPage() {
  render(
    <JobriqProvider>
      <ReadyPage />
    </JobriqProvider>,
  )

  await screen.findByRole('heading', { name: 'Applications' })
}

describe('ApplicationsPage', () => {
  it('renders the empty state', async () => {
    installMockApi()
    await renderPage()

    expect(screen.getByText('No applications yet')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Add your first application' }),
    ).toBeInTheDocument()
  })

  it('adds an application through the dialog', async () => {
    const user = userEvent.setup()
    const api = installMockApi()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Add application' }))
    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText('Company'), 'Globex')
    await user.type(within(dialog).getByLabelText('Role'), 'Developer')
    await user.type(within(dialog).getByLabelText('Job description'), 'Write code.')
    await user.click(within(dialog).getByRole('button', { name: 'Add application' }))

    expect(await screen.findByText('Globex')).toBeInTheDocument()
    await waitFor(() => {
      expect(api.state.applications[0]?.company).toBe('Globex')
    })
  })

  it('shows an API error when the application cannot be added', async () => {
    const user = userEvent.setup()
    installMockApi({
      fail: {
        create: {
          status: 503,
          detail: 'The application could not be saved.',
          code: 'database_unavailable',
        },
      },
    })
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Add application' }))
    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText('Company'), 'Globex')
    await user.type(within(dialog).getByLabelText('Role'), 'Developer')
    await user.type(within(dialog).getByLabelText('Job description'), 'Write code.')
    await user.click(within(dialog).getByRole('button', { name: 'Add application' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'The application could not be saved.',
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('validates the add dialog', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Add application' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Add application' }))

    expect(await within(dialog).findByText('Company is required')).toBeInTheDocument()
    expect(within(dialog).getByText('Role is required')).toBeInTheDocument()
    expect(within(dialog).getByText('Job description is required')).toBeInTheDocument()
  })

  it('renders a seeded application with its status', async () => {
    installMockApi({ state: stateWithApplication() })
    await renderPage()

    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Engineer')).toBeInTheDocument()
    expect(screen.getByLabelText('Application status')).toHaveValue('saved')
  })

  it('updates an application status inline', async () => {
    const user = userEvent.setup()
    const api = installMockApi({ state: stateWithApplication() })
    await renderPage()

    await user.selectOptions(screen.getByLabelText('Application status'), 'interviewing')

    await waitFor(() => {
      expect(api.state.applications[0]?.status).toBe('interviewing')
    })
  })

  it('deletes an application after confirmation', async () => {
    const user = userEvent.setup()
    const api = installMockApi({ state: stateWithApplication() })
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Delete Engineer at Acme' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('No applications yet')).toBeInTheDocument()
    await waitFor(() => {
      expect(api.state.applications).toHaveLength(0)
    })
  })

  it('generates a resume and previews it', async () => {
    const user = userEvent.setup()
    const api = installMockApi({
      state: stateWithApplication(),
      generatedResume: generated,
    })
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Generate resume' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Generate resume' }))

    expect(await within(dialog).findByText('Tailored summary.')).toBeInTheDocument()
    expect(within(dialog).getByText('Kubernetes')).toBeInTheDocument()
    await waitFor(() => {
      expect(api.state.applications[0]?.generatedResume?.summary).toBe(
        'Tailored summary.',
      )
    })
  })

  it('shows the API error message when generation fails', async () => {
    const user = userEvent.setup()
    installMockApi({
      state: stateWithApplication(),
      fail: {
        generate: {
          status: 503,
          detail: 'OpenAI API key is not configured.',
          code: 'missing_api_key',
        },
      },
    })
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Generate resume' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Generate resume' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'OpenAI API key is not configured.',
    )
  })
})
