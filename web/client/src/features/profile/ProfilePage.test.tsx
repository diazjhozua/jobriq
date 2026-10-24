import { render, screen, waitFor } from '@testing-library/react'
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
