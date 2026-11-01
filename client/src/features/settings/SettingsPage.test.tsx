import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { createEmptyState } from '../../lib/defaults'
import { installMockApi } from '../../test/mockApi'
import { JobriqProvider, useJobriq } from '../../providers/JobriqProvider'
import { SettingsPage } from './SettingsPage'

function ReadyPage() {
  const { status } = useJobriq()

  if (status !== 'ready') {
    return <p>Loading</p>
  }

  return <SettingsPage />
}

async function renderPage() {
  render(
    <MemoryRouter>
      <JobriqProvider>
        <ReadyPage />
      </JobriqProvider>
    </MemoryRouter>,
  )

  await screen.findByRole('heading', { name: 'Settings' })
}

async function createStyle(name: string, instructions: string) {
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: 'New prompt style' }))
  const dialog = await screen.findByRole('dialog')

  await user.type(within(dialog).getByLabelText('Name'), name)
  await user.type(within(dialog).getByLabelText('Instructions'), instructions)
  await user.click(
    within(dialog).getByRole('button', { name: 'Create prompt style' }),
  )

  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
}

describe('SettingsPage', () => {
  it('shows the read-only baseline and an empty saved list', async () => {
    installMockApi()
    await renderPage()

    expect(
      screen.getByRole('heading', { name: 'Built-in baseline' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Read-only')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'No saved styles yet' }),
    ).toBeInTheDocument()
  })

  it('activates the first saved style automatically', async () => {
    const api = installMockApi()
    await renderPage()

    await createStyle('Warm voice', 'Prefer warm, plain sentences.')

    const styleHeading = await screen.findByRole('heading', {
      name: 'Warm voice',
    })
    const item = styleHeading.closest('li')
    expect(item).not.toBeNull()
    expect(within(item as HTMLElement).getByText('Active')).toBeInTheDocument()
    expect(
      within(item as HTMLElement).queryByRole('button', {
        name: 'Set active Warm voice',
      }),
    ).not.toBeInTheDocument()

    expect(api.state.promptStyles.styles).toHaveLength(1)
    expect(api.state.promptStyles.activeStyleId).toBe(
      api.state.promptStyles.styles[0]?.id,
    )
  })

  it('keeps later styles inactive until set active', async () => {
    const api = installMockApi()
    await renderPage()

    await createStyle('Warm voice', 'Prefer warm, plain sentences.')
    await createStyle('Terse voice', 'Cut every extra word.')

    const terse = (await screen.findByRole('heading', { name: 'Terse voice' }))
      .closest('li') as HTMLElement
    expect(within(terse).queryByText('Active')).not.toBeInTheDocument()

    await userEvent
      .setup()
      .click(within(terse).getByRole('button', { name: 'Set active Terse voice' }))

    await waitFor(() => {
      expect(
        within(terse).getByText('Active'),
      ).toBeInTheDocument()
    })
    expect(api.state.promptStyles.activeStyleId).toBe(
      api.state.promptStyles.styles[1]?.id,
    )
  })

  it('rejects a duplicate style name', async () => {
    installMockApi()
    await renderPage()

    await createStyle('Warm voice', 'Prefer warm, plain sentences.')

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'New prompt style' }))
    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText('Name'), 'warm voice')
    await user.type(within(dialog).getByLabelText('Instructions'), 'Again.')
    await user.click(
    within(dialog).getByRole('button', { name: 'Create prompt style' }),
  )

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'A prompt style named "warm voice" already exists.',
    )
  })

  it('edits a saved style', async () => {
    const api = installMockApi()
    await renderPage()

    await createStyle('Warm voice', 'Prefer warm, plain sentences.')

    const item = (
      await screen.findByRole('heading', { name: 'Warm voice' })
    ).closest('li') as HTMLElement

    await userEvent
      .setup()
      .click(within(item).getByRole('button', { name: 'Edit Warm voice' }))

    const dialog = await screen.findByRole('dialog')
    const name = within(dialog).getByLabelText('Name')
    await userEvent.setup().clear(name)
    await userEvent.setup().type(name, 'Warmer voice')
    await userEvent
      .setup()
      .click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(
      await screen.findByRole('heading', { name: 'Warmer voice' }),
    ).toBeInTheDocument()
    expect(api.state.promptStyles.styles[0]?.name).toBe('Warmer voice')
  })

  it('falls back to the baseline when the active style is deleted', async () => {
    const api = installMockApi()
    await renderPage()

    await createStyle('Warm voice', 'Prefer warm, plain sentences.')

    const item = (
      await screen.findByRole('heading', { name: 'Warm voice' })
    ).closest('li') as HTMLElement

    await userEvent
      .setup()
      .click(within(item).getByRole('button', { name: 'Delete Warm voice' }))

    const confirm = await screen.findByRole('alertdialog')
    await userEvent
      .setup()
      .click(within(confirm).getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(api.state.promptStyles.styles).toHaveLength(0)
    })
    expect(api.state.promptStyles.activeStyleId).toBeNull()
    expect(
      screen.getByRole('heading', { name: 'No saved styles yet' }),
    ).toBeInTheDocument()
  })

  it('renders an empty baseline for a state without prompt styles', async () => {
    const state = createEmptyState()
    installMockApi({ state })
    await renderPage()

    expect(
      screen.getByText(
        'Jobriq writes in a plain, professional voice and uses only the details you already wrote.',
      ),
    ).toBeInTheDocument()
  })
})
