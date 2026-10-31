import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { createEmptyState } from '../../lib/defaults'
import { installMockApi } from '../../test/mockApi'
import type { CoverLetter, GeneratedResume, JobriqState } from '../../lib/types'
import { JobriqProvider, useJobriq } from '../../providers/JobriqProvider'
import { ApplicationsPage } from './ApplicationsPage'

const application = {
  id: 'app-1',
  company: 'Acme',
  role: 'Engineer',
  jobDescription: 'Build reliable systems.',
  status: 'saved' as const,
  createdAt: '2026-10-24T12:00:00.000Z',
  appliedDate: '',
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
  certifications: [],
  awards: [],
  skills: ['C#'],
  projects: [],
  keywords: { matched: ['C#'], missing: ['Kubernetes'] },
  generatedAt: '2026-10-24T12:00:00.000Z',
}

const coverLetter: CoverLetter = {
  personal: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
  },
  company: 'Acme',
  role: 'Engineer',
  salutation: 'Dear Acme Hiring Team,',
  paragraphs: ['First paragraph.', 'Second paragraph.', 'Third paragraph.'],
  closing: 'Sincerely,',
  signature: 'Jane Doe',
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
    <MemoryRouter>
      <JobriqProvider>
        <ReadyPage />
      </JobriqProvider>
    </MemoryRouter>,
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

  it('renders a seeded application in a semantic table', async () => {
    installMockApi({ state: stateWithApplication() })
    await renderPage()

    expect(
      screen.getByRole('table', { name: 'Job applications' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('columnheader').map((header) => header.textContent),
    ).toEqual(['Application', 'Status', 'Added', 'Actions'])
    expect(screen.getByRole('rowheader', { name: /Acme/ })).toBeInTheDocument()
    expect(screen.getByLabelText('Status for Engineer at Acme')).toHaveValue('saved')
  })

  it('expands and collapses the job description', async () => {
    const user = userEvent.setup()
    installMockApi({ state: stateWithApplication() })
    await renderPage()

    const toggle = screen.getByRole('button', {
      name: 'View description for Engineer at Acme',
    })
    const detail = screen.getByText('Build reliable systems.').closest('tr')

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(detail).toHaveAttribute('hidden')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(detail).not.toHaveAttribute('hidden')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(detail).toHaveAttribute('hidden')
  })

  it('keeps the description expanded after a status change', async () => {
    const user = userEvent.setup()
    const api = installMockApi({ state: stateWithApplication() })
    await renderPage()

    const toggle = screen.getByRole('button', {
      name: 'View description for Engineer at Acme',
    })
    await user.click(toggle)
    await user.selectOptions(screen.getByLabelText('Status for Engineer at Acme'), 'interviewing')

    await waitFor(() => {
      expect(api.state.applications[0]?.status).toBe('interviewing')
    })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Build reliable systems.').closest('tr')).not.toHaveAttribute(
      'hidden',
    )
  })

  it('expands only one description at a time', async () => {
    const user = userEvent.setup()
    const state = stateWithApplication()
    state.applications.push({
      ...application,
      id: 'app-2',
      company: 'Globex',
      role: 'Developer',
      jobDescription: 'Write code.',
    })
    installMockApi({ state })
    await renderPage()

    await user.click(
      screen.getByRole('button', { name: 'View description for Engineer at Acme' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'View description for Developer at Globex' }),
    )

    expect(screen.getByText('Build reliable systems.').closest('tr')).toHaveAttribute(
      'hidden',
    )
    expect(screen.getByText('Write code.').closest('tr')).not.toHaveAttribute('hidden')
  })

  it('removes the description when its application is deleted', async () => {
    const user = userEvent.setup()
    installMockApi({ state: stateWithApplication() })
    await renderPage()

    await user.click(
      screen.getByRole('button', { name: 'View description for Engineer at Acme' }),
    )
    await user.click(screen.getByRole('button', { name: 'Delete Engineer at Acme' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('No applications yet')).toBeInTheDocument()
    expect(screen.queryByText('Build reliable systems.')).not.toBeInTheDocument()
  })

  it('updates an application status inline', async () => {
    const user = userEvent.setup()
    const api = installMockApi({ state: stateWithApplication() })
    await renderPage()

    await user.selectOptions(screen.getByLabelText('Status for Engineer at Acme'), 'interviewing')

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

  it('warns to polish the profile before generating a resume', async () => {
    const user = userEvent.setup()
    installMockApi({ state: stateWithApplication() })
    await renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Generate resume for Engineer at Acme' }),
    )
    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).getByText('Polish your profile first')).toBeInTheDocument()
    expect(
      within(dialog).getByRole('link', { name: 'Open profile review' }),
    ).toHaveAttribute('href', '/profile#profile-review')
  })

  it('generates a resume and previews it', async () => {
    const user = userEvent.setup()
    const api = installMockApi({
      state: stateWithApplication(),
      generatedResume: generated,
    })
    await renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Generate resume for Engineer at Acme' }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Generate resume' }))

    expect(await within(dialog).findByText('Tailored summary.')).toBeInTheDocument()
    expect(within(dialog).getByText('Kubernetes')).toBeInTheDocument()
    await waitFor(() => {
      expect(api.state.applications[0]?.generatedResume?.summary).toBe(
        'Tailored summary.',
      )
    })

    await user.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(
      screen.getByRole('button', { name: 'View resume for Engineer at Acme' }),
    ).toBeInTheDocument()
  })

  it('generates a cover letter and previews it', async () => {
    const user = userEvent.setup()
    const api = installMockApi({ state: stateWithApplication() })
    await renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Write cover letter for Engineer at Acme' }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Write cover letter' }))

    expect(await within(dialog).findByText('Dear Acme Hiring Team,')).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        'A second paragraph connecting past work to the job description.',
      ),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(api.state.applications[0]?.coverLetter?.signature).toBe('Jane Doe')
    })
  })

  it('regenerates an existing cover letter', async () => {
    const user = userEvent.setup()
    const state = stateWithApplication()
    state.applications[0] = { ...application, coverLetter }
    installMockApi({ state })
    await renderPage()

    await user.click(
      screen.getByRole('button', { name: 'View cover letter for Engineer at Acme' }),
    )
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('First paragraph.')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Regenerate' }))

    expect(
      await within(dialog).findByText(
        'A second paragraph connecting past work to the job description.',
      ),
    ).toBeInTheDocument()
  })

  it('copies the cover letter body to the clipboard', async () => {
    const user = userEvent.setup()
    const state = stateWithApplication()
    state.applications[0] = { ...application, coverLetter }
    installMockApi({ state })
    await renderPage()

    await user.click(
      screen.getByRole('button', { name: 'View cover letter for Engineer at Acme' }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Copy' }))

    expect(await within(dialog).findByRole('button', { name: 'Copied' })).toBeInTheDocument()
    const copied = await navigator.clipboard.readText()
    expect(copied).toContain('Dear Acme Hiring Team,')
    expect(copied).toContain('Sincerely,\nJane Doe')
    expect(copied).not.toContain('jane@example.com')
  })

  it('shows the API error message when cover letter generation fails', async () => {
    const user = userEvent.setup()
    installMockApi({
      state: stateWithApplication(),
      fail: {
        coverLetter: {
          status: 503,
          detail: 'OpenAI API key is not configured.',
          code: 'missing_api_key',
        },
      },
    })
    await renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Write cover letter for Engineer at Acme' }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Write cover letter' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'OpenAI API key is not configured.',
    )
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

    await user.click(
      screen.getByRole('button', { name: 'Generate resume for Engineer at Acme' }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Generate resume' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'OpenAI API key is not configured.',
    )
  })
})
