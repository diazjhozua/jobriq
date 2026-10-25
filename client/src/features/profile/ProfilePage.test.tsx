import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createEmptyState } from '../../lib/defaults'
import { saveState, STORAGE_KEY } from '../../lib/storage'
import type { JobriqState } from '../../lib/types'
import { JobriqProvider } from '../../providers/JobriqProvider'
import { ProfilePage } from './ProfilePage'

function storedState(): JobriqState {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as JobriqState
}

function renderPage() {
  return render(
    <JobriqProvider>
      <ProfilePage />
    </JobriqProvider>,
  )
}

describe('ProfilePage', () => {
  it('hydrates saved values', () => {
    const state = createEmptyState()
    state.profile.personal.name = 'Jane Doe'
    state.profile.personal.email = 'jane@example.com'
    state.profile.skills = ['C#', 'React']
    saveState(state)

    renderPage()

    expect(screen.getByLabelText('Name')).toHaveValue('Jane Doe')
    expect(screen.getByLabelText('Email')).toHaveValue('jane@example.com')
    expect(screen.getByLabelText('Skills')).toHaveValue('C#, React')
  })

  it('blocks invalid input with inline errors', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(storedState().profile.personal.email).toBe('')
  })

  it('saves every section and confirms', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Skills'), 'C#, React')

    await user.click(screen.getByRole('button', { name: 'Add experience' }))
    await user.type(screen.getByLabelText('Company'), 'Acme')
    await user.type(screen.getByLabelText('Title'), 'Engineer')
    await user.type(screen.getByLabelText('Bullets'), 'Built a thing')

    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
    await waitFor(() => {
      const profile = storedState().profile
      expect(profile.personal.name).toBe('Jane Doe')
      expect(profile.skills).toEqual(['C#', 'React'])
      expect(profile.experience).toHaveLength(1)
      expect(profile.experience[0]?.company).toBe('Acme')
      expect(profile.experience[0]?.bullets).toEqual(['Built a thing'])
    })
  })

  it('imports a pasted resume template and saves it', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Import template' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Template text'), {
      target: {
        value: [
          '[PERSONAL]',
          'Name: Jane Doe',
          'Email: jane@example.com',
          'LinkedIn: linkedin.com/in/jane',
          '',
          '[EXPERIENCE]',
          'Company: Acme',
          'Title: Engineer',
          '- Built a thing',
          '',
          '[SKILLS]',
          'C#, React',
        ].join('\n'),
      },
    })
    await user.click(within(dialog).getByRole('button', { name: 'Import profile' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(screen.getByLabelText('Name')).toHaveValue('Jane Doe')
    expect(screen.getByLabelText('LinkedIn')).toHaveValue('https://linkedin.com/in/jane')
    expect(screen.getByLabelText('Skills')).toHaveValue('C#, React')
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(storedState().profile.experience[0]?.company).toBe('Acme')
  })

  it('reports validation errors from an imported template', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Import template' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Template text'), {
      target: { value: ['[PERSONAL]', 'Name: Jane Doe'].join('\n') },
    })
    await user.click(within(dialog).getByRole('button', { name: 'Import profile' }))

    expect(
      await within(dialog).findByText('personal.email: Enter a valid email address'),
    ).toBeInTheDocument()
  })

  it('adds and removes repeatable entries', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Add education' }))
    await user.click(screen.getByRole('button', { name: 'Add project' }))

    expect(screen.getByLabelText('School')).toBeInTheDocument()
    expect(screen.getByText('Project 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove education 1' }))
    await user.click(screen.getByRole('button', { name: 'Remove project 1' }))

    expect(screen.queryByLabelText('School')).not.toBeInTheDocument()
    expect(screen.queryByText('Project 1')).not.toBeInTheDocument()
  })
})
