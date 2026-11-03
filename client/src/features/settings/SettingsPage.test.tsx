import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { createEmptyState } from '../../lib/defaults'
import { installMockApi } from '../../test/mockApi'
import {
  CLASSIC_THEME_ID,
  MODERN_THEME_ID,
  stateWithThemes,
} from '../../test/resumeThemes'
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

function themeCard(name: string): HTMLElement {
  const heading = screen.getByRole('heading', { name })
  const card = heading.closest('li')

  if (!card) {
    throw new Error(`No theme card found for ${name}.`)
  }

  return card
}

async function createTheme(name: string) {
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: 'New theme' }))
  const dialog = await screen.findByRole('dialog')

  await user.type(within(dialog).getByLabelText('Name'), name)
  await user.click(within(dialog).getByRole('button', { name: 'Create theme' }))

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

describe('SettingsPage resume themes', () => {
  it('shows the built-in themes with the active one marked read-only', async () => {
    installMockApi({ state: stateWithThemes() })
    await renderPage()

    expect(
      screen.getByRole('heading', { name: 'Built-in themes' }),
    ).toBeInTheDocument()

    const classic = themeCard('Classic')
    expect(within(classic).getByText('Active')).toBeInTheDocument()
    expect(within(classic).getByText('Read-only')).toBeInTheDocument()
    expect(within(classic).getByText('Jane Doe')).toHaveStyle({
      fontFamily: 'Calibri',
    })
    expect(
      within(classic).queryByRole('button', { name: 'Edit Classic' }),
    ).not.toBeInTheDocument()

    const modern = themeCard('Modern')
    expect(within(modern).queryByText('Active')).not.toBeInTheDocument()
    expect(
      within(modern).getByRole('button', { name: 'Set active Modern' }),
    ).toBeInTheDocument()
    expect(within(modern).getByText('Jane Doe')).toHaveStyle({
      fontFamily: 'Segoe UI',
    })

    expect(
      screen.getByRole('heading', { name: 'No saved themes yet' }),
    ).toBeInTheDocument()
  })

  it('activates a built-in theme', async () => {
    const api = installMockApi({ state: stateWithThemes() })
    await renderPage()

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Set active Modern' }))

    await waitFor(() => {
      expect(api.state.resumeThemes.activeThemeId).toBe(MODERN_THEME_ID)
    })

    expect(within(themeCard('Modern')).getByText('Active')).toBeInTheDocument()
    expect(
      within(themeCard('Classic')).queryByText('Active'),
    ).not.toBeInTheDocument()
  })

  it('creates a custom theme without activating it', async () => {
    const api = installMockApi({ state: stateWithThemes() })
    await renderPage()

    await createTheme('Warm serif')

    expect(
      await screen.findByRole('heading', { name: 'Warm serif' }),
    ).toBeInTheDocument()

    const card = themeCard('Warm serif')
    expect(within(card).queryByText('Active')).not.toBeInTheDocument()
    expect(
      within(card).getByRole('button', { name: 'Set active Warm serif' }),
    ).toBeInTheDocument()

    expect(api.state.resumeThemes.themes).toHaveLength(1)
    expect(api.state.resumeThemes.themes[0]?.name).toBe('Warm serif')
    expect(api.state.resumeThemes.activeThemeId).toBe(CLASSIC_THEME_ID)
  })

  it('edits a custom theme', async () => {
    const api = installMockApi({ state: stateWithThemes() })
    await renderPage()

    await createTheme('Warm serif')

    await userEvent
      .setup()
      .click(
        within(themeCard('Warm serif')).getByRole('button', {
          name: 'Edit Warm serif',
        }),
      )

    const dialog = await screen.findByRole('dialog')
    const name = within(dialog).getByLabelText('Name')
    await userEvent.setup().clear(name)
    await userEvent.setup().type(name, 'Warmer serif')
    await userEvent
      .setup()
      .click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    expect(
      await screen.findByRole('heading', { name: 'Warmer serif' }),
    ).toBeInTheDocument()
    expect(api.state.resumeThemes.themes[0]?.name).toBe('Warmer serif')
  })

  it('falls back to Classic when the active custom theme is deleted', async () => {
    const api = installMockApi({ state: stateWithThemes() })
    await renderPage()

    await createTheme('Warm serif')
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Set active Warm serif' }))

    await waitFor(() => {
      expect(api.state.resumeThemes.activeThemeId).not.toBe(CLASSIC_THEME_ID)
    })

    await userEvent
      .setup()
      .click(
        within(themeCard('Warm serif')).getByRole('button', {
          name: 'Delete Warm serif',
        }),
      )

    const confirm = await screen.findByRole('alertdialog')
    await userEvent
      .setup()
      .click(within(confirm).getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(api.state.resumeThemes.themes).toHaveLength(0)
    })

    expect(api.state.resumeThemes.activeThemeId).toBe(CLASSIC_THEME_ID)
    expect(within(themeCard('Classic')).getByText('Active')).toBeInTheDocument()
  })

  it('previews the active theme by default', async () => {
    installMockApi({ state: stateWithThemes() })
    await renderPage()

    const pane = screen.getByRole('region', { name: 'Theme preview' })
    expect(within(pane).getByText('Classic')).toBeInTheDocument()
    expect(within(pane).getByText('Jane Doe')).toHaveStyle({
      fontFamily: 'Calibri',
    })
  })

  it('previews a theme without activating it', async () => {
    const api = installMockApi({ state: stateWithThemes() })
    await renderPage()

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Preview Modern' }))

    const pane = screen.getByRole('region', { name: 'Theme preview' })
    expect(within(pane).getByText('Modern')).toBeInTheDocument()
    expect(within(pane).getByText('Jane Doe')).toHaveStyle({
      fontFamily: 'Segoe UI',
    })
    expect(
      screen.getByRole('button', { name: 'Preview Modern' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(api.state.resumeThemes.activeThemeId).toBe(CLASSIC_THEME_ID)
    expect(within(themeCard('Classic')).getByText('Active')).toBeInTheDocument()
    expect(
      within(themeCard('Modern')).queryByText('Active'),
    ).not.toBeInTheDocument()
  })

  it('previews a theme with the keyboard', async () => {
    installMockApi({ state: stateWithThemes() })
    await renderPage()

    const user = userEvent.setup()
    screen.getByRole('button', { name: 'Preview Modern' }).focus()
    await user.keyboard('{Enter}')

    expect(
      within(screen.getByRole('region', { name: 'Theme preview' })).getByText(
        'Modern',
      ),
    ).toBeInTheDocument()
  })

  it('falls back to the active theme when the previewed theme is deleted', async () => {
    installMockApi({ state: stateWithThemes() })
    await renderPage()

    await createTheme('Warm serif')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Preview Warm serif' }))

    expect(
      within(screen.getByRole('region', { name: 'Theme preview' })).getByText(
        'Warm serif',
      ),
    ).toBeInTheDocument()

    await user.click(
      within(themeCard('Warm serif')).getByRole('button', {
        name: 'Delete Warm serif',
      }),
    )

    const confirm = await screen.findByRole('alertdialog')
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(
        within(screen.getByRole('region', { name: 'Theme preview' })).getByText(
          'Classic',
        ),
      ).toBeInTheDocument()
    })
  })

  it('shows an empty preview when no themes exist', async () => {
    installMockApi({ state: createEmptyState() })
    await renderPage()

    expect(
      within(screen.getByRole('region', { name: 'Theme preview' })).getByText(
        'No themes are available to preview.',
      ),
    ).toBeInTheDocument()
  })

  it('shows the full page preview in the theme dialog', async () => {
    installMockApi({ state: stateWithThemes() })
    await renderPage()

    await userEvent.setup().click(screen.getByRole('button', { name: 'New theme' }))
    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).getByText('Jane Doe')).toBeInTheDocument()
    expect(within(dialog).getByText('Professional Summary')).toBeInTheDocument()
  })

  it('rejects a theme name that collides with a built-in', async () => {
    installMockApi({ state: stateWithThemes() })
    await renderPage()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'New theme' }))
    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText('Name'), 'modern')
    await user.click(within(dialog).getByRole('button', { name: 'Create theme' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'A resume theme named "modern" already exists.',
    )
  })
})
