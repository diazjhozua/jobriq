import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { createEmptyState } from '../../lib/defaults'
import { installMockApi } from '../../test/mockApi'
import type { JobriqState } from '../../lib/types'
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

describe('ApplicationsPage editing', () => {
  it('adds an application with a date applied', async () => {
    const user = userEvent.setup()
    const api = installMockApi()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Add application' }))
    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText('Company'), 'Globex')
    await user.type(within(dialog).getByLabelText('Role'), 'Developer')
    await user.type(within(dialog).getByLabelText('Job description'), 'Write code.')

    await user.click(
      within(dialog).getByLabelText('Date applied (optional)'),
    )
    await user.selectOptions(
      screen.getByLabelText('Date applied year'),
      '2022',
    )
    await user.click(screen.getByRole('button', { name: 'August 2022' }))
    await user.click(
      within(dialog).getByRole('button', { name: 'Add application' }),
    )

    await waitFor(() => {
      expect(api.state.applications[0]?.appliedDate).toBe('2022-08-01')
    })
    expect(
      (await screen.findAllByText('Applied Aug 2022')).length,
    ).toBeGreaterThan(0)
  })

  it('edits an application company, role, and applied date', async () => {
    const user = userEvent.setup()
    const api = installMockApi({ state: stateWithApplication() })
    await renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Edit Engineer at Acme' }),
    )
    const dialog = await screen.findByRole('dialog')

    await user.clear(within(dialog).getByLabelText('Company'))
    await user.type(within(dialog).getByLabelText('Company'), 'Globex')
    await user.clear(within(dialog).getByLabelText('Role'))
    await user.type(within(dialog).getByLabelText('Role'), 'Developer')

    await user.click(
      within(dialog).getByLabelText('Date applied (optional)'),
    )
    await user.selectOptions(screen.getByLabelText('Date applied year'), '2022')
    await user.click(screen.getByRole('button', { name: 'August 2022' }))
    await user.click(
      within(dialog).getByRole('button', { name: 'Save changes' }),
    )

    await waitFor(() => {
      expect(api.state.applications[0]).toMatchObject({
        company: 'Globex',
        role: 'Developer',
        appliedDate: '2022-08-01',
      })
    })
    expect(
      (await screen.findAllByText('Applied Aug 2022')).length,
    ).toBeGreaterThan(0)
  })
})
