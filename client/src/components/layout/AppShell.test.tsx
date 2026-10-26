import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { installMockApi } from '../../test/mockApi'
import { JobriqProvider } from '../../providers/JobriqProvider'
import { AppShell } from './AppShell'

function renderShell() {
  return render(
    <JobriqProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<p>Workspace content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </JobriqProvider>,
  )
}

describe('AppShell', () => {
  it('shows a loading state before rendering the workspace', async () => {
    installMockApi()

    renderShell()

    expect(screen.getByText('Loading your workspace')).toBeInTheDocument()
    expect(await screen.findByText('Workspace content')).toBeInTheDocument()
  })

  it('shows a retry panel instead of an empty workspace when hydration fails', async () => {
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

    renderShell()

    expect(
      await screen.findByRole('heading', { name: 'Could not load your workspace' }),
    ).toBeInTheDocument()
    expect(screen.getByText('The database is unavailable.')).toBeInTheDocument()
    expect(screen.queryByText('Workspace content')).not.toBeInTheDocument()

    api.fail.state = undefined
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Workspace content')).toBeInTheDocument()
  })
})
