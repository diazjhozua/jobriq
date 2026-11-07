import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyState } from '../../lib/defaults'
import { installMockApi } from '../../test/mockApi'
import type { JobriqState } from '../../lib/types'
import { JobriqProvider, useJobriq } from '../../providers/JobriqProvider'
import { ProfilePage } from './ProfilePage'

function stateWithProfile(): JobriqState {
  const state = createEmptyState()
  state.profile.personal.name = 'Jane Doe'
  state.profile.personal.email = 'jane@example.com'
  state.profile.skills = ['C#', 'React']
  return state
}

function ReadyPage() {
  const { status } = useJobriq()

  if (status !== 'ready') {
    return <p>Loading</p>
  }

  return <ProfilePage />
}

async function renderPage() {
  render(
    <MemoryRouter>
      <JobriqProvider>
        <ReadyPage />
      </JobriqProvider>
    </MemoryRouter>,
  )

  await screen.findByRole('heading', { name: 'Profile' })
}

describe('ProfilePage', () => {
  it('hydrates saved values', async () => {
    installMockApi({ state: stateWithProfile() })
    await renderPage()

    expect(screen.getByLabelText('Name')).toHaveValue('Jane Doe')
    expect(screen.getByLabelText('Email')).toHaveValue('jane@example.com')
    expect(screen.getByRole('button', { name: 'Remove skill C#' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove skill React' })).toBeInTheDocument()
  })

  it('shows the save bar only while there are unsaved changes', async () => {
    const user = userEvent.setup()
    installMockApi({ state: stateWithProfile() })
    await renderPage()

    expect(
      screen.queryByRole('button', { name: 'Save profile' }),
    ).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Name'), ' Jr')

    const save = screen.getByRole('button', { name: 'Save profile' })
    expect(save).toBeEnabled()
    expect(save.closest('header')).toBeNull()
  })

  it('disables the save bar while the profile is saving', async () => {
    const user = userEvent.setup()
    let release: () => void = () => {}
    const profileGate = new Promise<void>((resolve) => {
      release = resolve
    })
    installMockApi({ profileGate })
    await renderPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('Saving…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled()

    release()

    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('keeps the save bar open when saving fails', async () => {
    const user = userEvent.setup()
    const api = installMockApi({
      fail: {
        profile: {
          status: 500,
          detail: 'Save failed.',
          code: 'request_failed',
        },
      },
    })
    await renderPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(() => {
      expect(api.calls.some((call) => call.method === 'PUT')).toBe(true)
    })
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeEnabled()
  })

  it('blocks invalid input with inline errors', async () => {
    const user = userEvent.setup()
    const api = installMockApi()
    await renderPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    const email = screen.getByLabelText('Email')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAccessibleDescription('Enter a valid email address')
    expect(api.state.profile.personal.email).toBe('')
  })

  it('saves every section and confirms', async () => {
    const user = userEvent.setup()
    const api = installMockApi()
    await renderPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(
      screen.getByRole('textbox', { name: 'Skills' }),
      'C#{Enter}React{Enter}',
    )

    await user.click(screen.getByRole('button', { name: 'Add experience' }))
    await user.type(screen.getByLabelText('Company'), 'Acme')
    await user.type(screen.getByLabelText('Title'), 'Engineer')
    await user.type(screen.getByLabelText('Experience 1 bullet 1'), 'Built a thing')

    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
    await waitFor(() => {
      const profile = api.state.profile
      expect(profile.personal.name).toBe('Jane Doe')
      expect(profile.skills).toEqual(['C#', 'React'])
      expect(profile.experience).toHaveLength(1)
      expect(profile.experience[0]?.company).toBe('Acme')
      expect(profile.experience[0]?.bullets).toEqual(['Built a thing'])
    })
  }, 10000)

  it('imports a pasted resume template and saves it', async () => {
    const user = userEvent.setup()
    const api = installMockApi()
    await renderPage()

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
    expect(screen.getByRole('button', { name: 'Remove skill C#' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove skill React' })).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(api.state.profile.experience[0]?.company).toBe('Acme')
  })

  it('reports validation errors from an imported template', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

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

  it('exports the current form values as a template', async () => {
    const user = userEvent.setup()
    const createObjectURL = vi.fn(() => 'blob:profile')
    Object.defineProperty(URL, 'createObjectURL', {
      value: createObjectURL,
      configurable: true,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
    })
    const api = installMockApi({ state: stateWithProfile() })
    await renderPage()

    await user.type(screen.getByLabelText('Name'), ' Jr')
    await user.click(screen.getByRole('button', { name: 'Export profile' }))

    await waitFor(() => {
      expect(api.calls.at(-1)).toMatchObject({
        method: 'POST',
        path: '/api/profile/export',
      })
    })
    expect(api.calls.at(-1)?.body).toMatchObject({
      profile: { personal: { name: 'Jane Doe Jr' } },
    })
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('disables the export button while the request runs', async () => {
    const user = userEvent.setup()
    let release: () => void = () => {}
    const exportGate = new Promise<void>((resolve) => {
      release = resolve
    })
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:profile'),
      configurable: true,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
    })
    installMockApi({ state: stateWithProfile(), exportGate })
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Export profile' }))

    const button = screen.getByRole('button', { name: 'Export profile' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Exporting profile…')).toBeInTheDocument()

    release()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Export profile' })).toBeEnabled()
    })
  })

  it('shows an export error without blocking the form', async () => {
    const user = userEvent.setup()
    installMockApi({
      state: stateWithProfile(),
      fail: {
        profileExport: {
          status: 500,
          detail: 'The profile could not be exported.',
          code: 'export_failed',
        },
      },
    })
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Export profile' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The profile could not be exported.',
    )
    expect(screen.getByRole('button', { name: 'Export profile' })).toBeEnabled()
  })

  it('reviews unsaved form values without saving the profile', async () => {
    const user = userEvent.setup()
    const api = installMockApi()
    await renderPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: 'Add experience' }))
    await user.type(screen.getByLabelText('Company'), 'Acme')
    await user.type(screen.getByLabelText('Title'), 'Engineer')
    await user.type(screen.getByLabelText('Experience 1 bullet 1'), 'Unsaved bullet')

    await user.click(screen.getByRole('button', { name: 'Review profile' }))
    await screen.findByText(/3 suggestions/)

    const reviewCall = api.calls.find(
      (call) => call.path === '/api/profile/review',
    )
    expect(reviewCall?.body).toMatchObject({
      profile: {
        personal: { name: 'Jane Doe' },
        experience: [{ company: 'Acme', bullets: ['Unsaved bullet'] }],
      },
    })
    expect(
      api.calls.some(
        (call) => call.method === 'PUT' && call.path === '/api/profile',
      ),
    ).toBe(false)
  })

  it('applies a summary proposal into the form and marks it dirty', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    await user.type(
      screen.getByRole('textbox', { name: 'Summary' }),
      'Old summary',
    )
    await user.click(screen.getByRole('button', { name: 'Review profile' }))
    await screen.findByText(/2 suggestions/)

    await user.click(
      screen.getByRole('button', {
        name: 'Apply suggestion: Add a professional summary',
      }),
    )

    expect(screen.getByRole('textbox', { name: 'Summary' })).toHaveValue(
      'Deterministic reviewed summary.',
    )
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeEnabled()
  })

  it('refuses a summary proposal after the blank summary is filled in', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Review profile' }))
    await screen.findByText(/2 suggestions/)

    await user.type(screen.getByRole('textbox', { name: 'Summary' }), 'Typed after review')
    await user.click(
      screen.getByRole('button', {
        name: 'Apply suggestion: Add a professional summary',
      }),
    )

    expect(
      screen.getByText(
        'This suggestion no longer matches the form. Run the review again.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Summary' })).toHaveValue(
      'Typed after review',
    )
  })

  it('applies a bullet proposal into the matching experience entry', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Add experience' }))
    await user.type(screen.getByLabelText('Company'), 'Acme')
    await user.type(screen.getByLabelText('Title'), 'Engineer')
    await user.type(screen.getByLabelText('Experience 1 bullet 1'), 'Built a thing')
    await user.click(screen.getByRole('button', { name: 'Review profile' }))
    await screen.findByText(/3 suggestions/)

    await user.click(
      screen.getByRole('button', {
        name: 'Apply suggestion: Quantify your impact',
      }),
    )

    expect(screen.getByLabelText('Experience 1 bullet 1')).toHaveValue(
      'Reviewed: Built a thing',
    )
  })

  it('refuses a bullet proposal after the bullet is edited', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Add experience' }))
    await user.type(screen.getByLabelText('Company'), 'Acme')
    await user.type(screen.getByLabelText('Title'), 'Engineer')
    await user.type(screen.getByLabelText('Experience 1 bullet 1'), 'Built a thing')
    await user.click(screen.getByRole('button', { name: 'Review profile' }))
    await screen.findByText(/3 suggestions/)

    await user.clear(screen.getByLabelText('Experience 1 bullet 1'))
    await user.type(screen.getByLabelText('Experience 1 bullet 1'), 'Edited bullet')
    await user.click(
      screen.getByRole('button', {
        name: 'Apply suggestion: Quantify your impact',
      }),
    )

    expect(
      screen.getByText(
        'This suggestion no longer matches the form. Run the review again.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Experience 1 bullet 1')).toHaveValue('Edited bullet')
  })

  it('keeps suggestions after saving the profile', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(
      screen.getByRole('textbox', { name: 'Summary' }),
      'Old summary',
    )
    await user.click(screen.getByRole('button', { name: 'Review profile' }))
    await screen.findByText(/2 suggestions/)

    await user.click(
      screen.getByRole('button', {
        name: 'Apply suggestion: Add a professional summary',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('Add a professional summary')).toBeInTheDocument()
  })

  it('offers no Apply button for advisory skills suggestions', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Review profile' }))
    await screen.findByText(/2 suggestions/)

    const skills = document.getElementById('review-skills')
    expect(skills).not.toBeNull()
    expect(within(skills as HTMLElement).queryByRole('button')).not.toBeInTheDocument()
  })

  it('generates a standalone resume from unsaved form values', async () => {
    const user = userEvent.setup()
    const api = installMockApi()
    await renderPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: 'Resume' }))

    const dialog = await screen.findByRole('dialog')
    await user.type(
      within(dialog).getByLabelText('Job description (optional)'),
      'Build things.',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Generate resume' }),
    )

    expect(await within(dialog).findByText('Generated summary.')).toBeInTheDocument()

    const generateCall = api.calls.find(
      (call) => call.path === '/api/profile/resume',
    )
    expect(generateCall?.body).toMatchObject({
      profile: { personal: { name: 'Jane Doe' } },
      jobDescription: 'Build things.',
    })
    expect(
      api.calls.some(
        (call) => call.method === 'PUT' && call.path === '/api/profile',
      ),
    ).toBe(false)
    expect(api.state.applications).toHaveLength(0)
  })

  it('reopens the job description form when regenerating', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Resume' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Generate resume' }),
    )
    await within(dialog).findByText('Generated summary.')

    await user.click(within(dialog).getByRole('button', { name: 'Regenerate' }))

    expect(
      within(dialog).getByLabelText('Job description (optional)'),
    ).toBeInTheDocument()
    expect(within(dialog).queryByText('Generated summary.')).not.toBeInTheDocument()
  })

  it('shows a standalone generation error inside the dialog', async () => {
    const user = userEvent.setup()
    installMockApi({
      fail: {
        standalone: {
          status: 503,
          detail: 'OpenAI is unavailable.',
          code: 'openai_rate_limited',
        },
      },
    })
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Resume' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Generate resume' }),
    )

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'OpenAI is unavailable.',
    )
  })

  it('links to every profile section', async () => {
    installMockApi()
    await renderPage()

    const nav = screen.getByRole('navigation', { name: 'Profile sections' })
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual([
      '#profile-personal',
      '#profile-summary',
      '#profile-experience',
      '#profile-education',
      '#profile-certifications',
      '#profile-awards',
      '#profile-skills',
      '#profile-projects',
    ])
  })

  it('adds and removes skills as tags', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    await user.type(
      screen.getByRole('textbox', { name: 'Skills' }),
      'TypeScript{Enter}',
    )
    expect(
      screen.getByRole('button', { name: 'Remove skill TypeScript' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Save profile' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove skill TypeScript' }))
    expect(
      screen.queryByRole('button', { name: 'Remove skill TypeScript' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Save profile' }),
    ).not.toBeInTheDocument()
  })

  it('suggests skills gained in entries and adds them to Skills', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Add experience' }))
    const experience = screen.getByRole('group', { name: 'Experience 1' })
    await user.type(
      within(experience).getByRole('textbox', { name: 'Experience 1 skills gained' }),
      'Docker{Enter}Kubernetes{Enter}',
    )

    const panel = screen.getByRole('region', {
      name: 'Skills gained not in your Skills list',
    })
    expect(
      within(panel).getByRole('group', { name: 'Work experience · Experience 1' }),
    ).toBeInTheDocument()

    await user.click(
      within(panel).getByRole('button', { name: 'Add Docker to skills' }),
    )
    expect(
      screen.getByRole('button', { name: 'Remove skill Docker' }),
    ).toBeInTheDocument()
    expect(
      within(panel).queryByRole('button', { name: 'Add Docker to skills' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add all missing' }))
    expect(
      screen.getByRole('button', { name: 'Remove skill Kubernetes' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('region', {
        name: 'Skills gained not in your Skills list',
      }),
    ).not.toBeInTheDocument()
  }, 15000)

  it('hides suggestions when entry skills are already listed', async () => {
    const state = stateWithProfile()
    state.profile.skills = ['Docker']
    state.profile.experience = [
      {
        id: 'experience-1',
        company: 'Acme',
        title: 'Engineer',
        startDate: '',
        endDate: '',
        bullets: [''],
        skillsGained: ['docker'],
      },
    ]
    installMockApi({ state })
    await renderPage()

    expect(
      screen.queryByRole('region', {
        name: 'Skills gained not in your Skills list',
      }),
    ).not.toBeInTheDocument()
  })

  it('saves per-entry skills gained', async () => {
    const user = userEvent.setup()
    const api = installMockApi()
    await renderPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: 'Add experience' }))
    await user.type(screen.getByLabelText('Company'), 'Acme')
    await user.type(screen.getByLabelText('Title'), 'Engineer')

    const experience = screen.getByRole('group', { name: 'Experience 1' })
    await user.type(
      within(experience).getByRole('textbox', { name: 'Experience 1 skills gained' }),
      'Docker{Enter}',
    )
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
    await waitFor(() => {
      expect(api.state.profile.experience[0]?.skillsGained).toEqual(['Docker'])
    })
  }, 15000)

  it('adds and removes individual bullets', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Add experience' }))
    await user.type(screen.getByLabelText('Experience 1 bullet 1'), 'First')
    await user.click(screen.getByRole('button', { name: 'Add bullet' }))
    await user.type(screen.getByLabelText('Experience 1 bullet 2'), 'Second')

    expect(screen.getByLabelText('Experience 1 bullet 1')).toHaveValue('First')
    expect(screen.getByLabelText('Experience 1 bullet 2')).toHaveValue('Second')

    await user.click(
      screen.getByRole('button', { name: 'Remove Experience 1 bullet 2' }),
    )
    expect(screen.queryByLabelText('Experience 1 bullet 2')).not.toBeInTheDocument()
  })

  it('warns to polish the profile before generating a resume', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Resume' }))
    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).getByText('Polish your profile first')).toBeInTheDocument()
    expect(
      within(dialog).getByRole('button', { name: 'Open profile review' }),
    ).toBeInTheDocument()
  })

  it('adds and removes repeatable entries', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Add education' }))
    await user.click(screen.getByRole('button', { name: 'Add project' }))

    expect(screen.getByLabelText('School')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Project 1' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove education 1' }))
    await user.click(screen.getByRole('button', { name: 'Remove project 1' }))

    expect(screen.queryByLabelText('School')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Project 1' })).not.toBeInTheDocument()
  })

  it('adds and removes certifications and awards', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    expect(screen.getByText('No certifications added yet.')).toBeInTheDocument()
    expect(screen.getByText('No awards added yet.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add certification' }))
    await user.click(screen.getByRole('button', { name: 'Add award' }))

    expect(
      screen.getByRole('heading', { name: 'Certification 1' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Award 1' })).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Remove certification 1' }),
    )
    await user.click(screen.getByRole('button', { name: 'Remove award 1' }))

    expect(screen.getByText('No certifications added yet.')).toBeInTheDocument()
    expect(screen.getByText('No awards added yet.')).toBeInTheDocument()
  })

  it('requires a certification name and an award title', async () => {
    const user = userEvent.setup()
    const api = installMockApi()
    await renderPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: 'Add certification' }))
    await user.click(screen.getByRole('button', { name: 'Add award' }))
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(
      await screen.findByText('Certification name is required'),
    ).toBeInTheDocument()
    expect(await screen.findByText('Award title is required')).toBeInTheDocument()
    expect(api.state.profile.certifications).toHaveLength(0)
  })

  it('saves certifications and awards with month and year dates', async () => {
    const user = userEvent.setup()
    const api = installMockApi()
    await renderPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')

    await user.click(screen.getByRole('button', { name: 'Add certification' }))
    await user.type(
      screen.getByLabelText('Name', { selector: '#certification-0-name' }),
      'AWS Solutions Architect',
    )
    await user.type(
      screen.getByLabelText('Issuing organization'),
      'Amazon Web Services',
    )
    await user.click(
      screen.getByLabelText('Issue date', { selector: '#certification-0-issue' }),
    )
    await user.selectOptions(
      screen.getByLabelText('Certification 1 issue date year'),
      '2024',
    )
    await user.click(screen.getByRole('button', { name: 'March 2024' }))
    await user.type(screen.getByLabelText('Credential ID'), 'ABC-123')
    await user.type(
      screen.getByLabelText('Credential URL'),
      'https://example.com/verify/ABC-123',
    )

    await user.click(screen.getByRole('button', { name: 'Add award' }))
    await user.type(screen.getByLabelText('Title'), 'Engineer of the Year')
    await user.type(screen.getByLabelText('Associated with'), 'Acme')
    await user.type(screen.getByLabelText('Issuer'), 'IEEE')
    await user.click(
      screen.getByLabelText('Issue date', { selector: '#award-0-issue' }),
    )
    await user.selectOptions(
      screen.getByLabelText('Award 1 issue date year'),
      '2023',
    )
    await user.click(screen.getByRole('button', { name: 'December 2023' }))
    await user.type(
      screen.getByLabelText('Description'),
      'Recognized for reliability work.',
    )

    const certificationNav = screen.getByRole('navigation', {
      name: 'Certification entries',
    })
    expect(
      within(certificationNav).getByRole('link', {
        name: '1 · AWS Solutions Architect — Amazon Web Services',
      }),
    ).toHaveAttribute('href', '#profile-certifications-entry-1')

    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
    await waitFor(() => {
      expect(api.state.profile.certifications[0]).toMatchObject({
        name: 'AWS Solutions Architect',
        issuingOrganization: 'Amazon Web Services',
        issueDate: 'Mar 2024',
        expirationDate: '',
        credentialId: 'ABC-123',
        credentialUrl: 'https://example.com/verify/ABC-123',
      })
      expect(api.state.profile.awards[0]).toMatchObject({
        title: 'Engineer of the Year',
        associatedWith: 'Acme',
        issuer: 'IEEE',
        issueDate: 'Dec 2023',
        description: 'Recognized for reliability work.',
      })
    })
  }, 15000)

  it('suggests schools for award associations and pools issuer values', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Add experience' }))
    await user.type(screen.getByLabelText('Company'), 'Acme')

    await user.click(screen.getByRole('button', { name: 'Add education' }))
    await user.type(screen.getByLabelText('School'), 'State University')

    await user.click(screen.getByRole('button', { name: 'Add certification' }))
    await user.type(
      screen.getByLabelText('Name', { selector: '#certification-0-name' }),
      'AWS Solutions Architect',
    )
    await user.type(
      screen.getByLabelText('Issuing organization'),
      'Amazon Web Services',
    )

    await user.click(screen.getByRole('button', { name: 'Add award' }))

    const association = screen.getByLabelText('Associated with')
    await user.click(association)
    expect(screen.getByRole('option', { name: 'Acme' })).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'State University' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: 'Personal Project' }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: 'State University' }))

    const issuer = screen.getByLabelText('Issuer')
    await user.click(issuer)
    expect(screen.getByRole('option', { name: 'Acme' })).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'State University' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'Amazon Web Services' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: 'Amazon Web Services' }))

    expect(association).toHaveValue('State University')
    expect(issuer).toHaveValue('Amazon Web Services')
  }, 15000)

  it('keeps a custom project association typed as free text', async () => {
    const user = userEvent.setup()
    const api = installMockApi()
    await renderPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')

    await user.click(screen.getByRole('button', { name: 'Add project' }))
    await user.type(
      screen.getByLabelText('Name', { selector: '#project-0-name' }),
      'Legacy App',
    )

    const association = screen.getByLabelText('Associated with (optional)')
    await user.type(association, 'OldCo')

    expect(association).toHaveValue('OldCo')
    expect(
      screen.queryByRole('option', { name: 'OldCo' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
    await waitFor(() => {
      expect(api.state.profile.projects[0]).toMatchObject({
        name: 'Legacy App',
        associatedWith: 'OldCo',
      })
    })
  }, 15000)

  it('clears an association', async () => {
    const user = userEvent.setup()
    const api = installMockApi()
    await renderPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')

    await user.click(screen.getByRole('button', { name: 'Add experience' }))
    await user.type(screen.getByLabelText('Company'), 'Acme')
    await user.type(screen.getByLabelText('Title'), 'Engineer')

    await user.click(screen.getByRole('button', { name: 'Add project' }))
    await user.type(
      screen.getByLabelText('Name', { selector: '#project-0-name' }),
      'Jobriq',
    )

    const association = screen.getByLabelText('Associated with (optional)')
    await user.click(association)
    await user.click(screen.getByRole('option', { name: 'Acme' }))
    expect(association).toHaveValue('Acme')

    await user.click(
      screen.getByRole('button', { name: 'Clear Associated with (optional)' }),
    )
    expect(association).toHaveValue('')

    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
    await waitFor(() => {
      expect(api.state.profile.projects[0]?.associatedWith).toBe('')
    })
  }, 15000)

  it('links to each experience entry and labels it with live values', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    expect(
      screen.queryByRole('navigation', { name: 'Work experience entries' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add experience' }))

    const nav = screen.getByRole('navigation', {
      name: 'Work experience entries',
    })
    const first = within(nav).getByRole('link', { name: 'Experience 1' })
    expect(first).toHaveAttribute('href', '#profile-experience-entry-1')
    expect(first).toHaveAttribute('aria-current', 'location')
    expect(document.getElementById('profile-experience-entry-1')).toHaveAttribute(
      'tabindex',
      '-1',
    )

    await user.type(screen.getByLabelText('Company'), 'Acme')
    await user.type(screen.getByLabelText('Title'), 'Engineer')

    expect(
      within(nav).getByRole('link', { name: '1 · Acme — Engineer' }),
    ).toHaveAttribute('href', '#profile-experience-entry-1')

    await user.click(screen.getByRole('button', { name: 'Add experience' }))
    expect(
      within(nav).getByRole('link', { name: 'Experience 2' }),
    ).toHaveAttribute('href', '#profile-experience-entry-2')
  })

  it('captures project dates and the associated company', async () => {
    const user = userEvent.setup()
    const api = installMockApi()
    await renderPage()

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: 'Add experience' }))
    await user.type(screen.getByLabelText('Company'), 'Acme')
    await user.type(screen.getByLabelText('Title'), 'Engineer')

    await user.click(screen.getByRole('button', { name: 'Add education' }))
    await user.type(screen.getByLabelText('School'), 'State University')

    await user.click(screen.getByRole('button', { name: 'Add project' }))
    await user.type(
      screen.getByLabelText('Name', { selector: '#project-0-name' }),
      'Jobriq',
    )

    const association = screen.getByLabelText('Associated with (optional)')
    await user.click(association)
    expect(screen.getByRole('option', { name: 'Acme' })).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'State University' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'Personal Project' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: 'Acme' }))

    await user.click(
      screen.getByLabelText('Start date', { selector: '#project-0-start' }),
    )
    await user.selectOptions(
      screen.getByLabelText('Project 1 start date year'),
      '2022',
    )
    await user.click(screen.getByRole('button', { name: 'August 2022' }))

    await user.click(
      screen.getByLabelText('End date', { selector: '#project-0-end' }),
    )
    await user.click(screen.getByRole('button', { name: 'Present' }))

    const projectNav = screen.getByRole('navigation', {
      name: 'Project entries',
    })
    expect(
      within(projectNav).getByRole('link', { name: '1 · Jobriq — Acme' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
    await waitFor(() => {
      expect(api.state.profile.projects[0]).toMatchObject({
        name: 'Jobriq',
        startDate: 'Aug 2022',
        endDate: 'Present',
        associatedWith: 'Acme',
      })
    })
  })

  it('links to each education and project entry', async () => {
    const user = userEvent.setup()
    installMockApi()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Add education' }))
    await user.click(screen.getByRole('button', { name: 'Add project' }))

    const educationNav = screen.getByRole('navigation', {
      name: 'Education entries',
    })
    expect(
      within(educationNav).getByRole('link', { name: 'Education 1' }),
    ).toHaveAttribute('href', '#profile-education-entry-1')

    const projectNav = screen.getByRole('navigation', { name: 'Project entries' })
    expect(
      within(projectNav).getByRole('link', { name: 'Project 1' }),
    ).toHaveAttribute('href', '#profile-projects-entry-1')

    await user.type(screen.getByLabelText('School'), 'State University')
    await user.type(
      screen.getByLabelText('Name', { selector: '#project-0-name' }),
      'Jobriq',
    )

    expect(
      within(educationNav).getByRole('link', { name: '1 · State University' }),
    ).toBeInTheDocument()
    expect(
      within(projectNav).getByRole('link', { name: '1 · Jobriq' }),
    ).toBeInTheDocument()
  })

  describe('auto arrange', () => {
    type ExperienceEntry = JobriqState['profile']['experience'][number]

    function experienceEntry(
      id: string,
      company: string,
      startDate: string,
      endDate = '',
    ): ExperienceEntry {
      return {
        id,
        company,
        title: company === 'Newer Co' ? 'Staff' : 'Engineer',
        startDate,
        endDate,
        bullets: ['Built a thing'],
        skillsGained: [],
      }
    }

    function stateWithExperience(entries: ExperienceEntry[]): JobriqState {
      const state = stateWithProfile()
      state.profile.experience = entries
      return state
    }

    type ProjectEntry = JobriqState['profile']['projects'][number]

    function projectEntry(
      id: string,
      name: string,
      startDate: string,
      endDate = '',
    ): ProjectEntry {
      return {
        id,
        name,
        url: '',
        startDate,
        endDate,
        associatedWith: '',
        bullets: ['Built a thing'],
        skillsGained: [],
      }
    }

    function stateWithProjects(entries: ProjectEntry[]): JobriqState {
      const state = stateWithProfile()
      state.profile.projects = entries
      return state
    }

    const companies = () =>
      screen
        .getAllByLabelText('Company')
        .map((input) => (input as HTMLInputElement).value)

    const projectNames = () =>
      screen
        .getAllByLabelText('Name', {
          selector: 'input[id^="project-"][id$="-name"]',
        })
        .map((input) => (input as HTMLInputElement).value)

    async function pickStartDate(
      user: ReturnType<typeof userEvent.setup>,
      index: number,
      year: string,
      monthLabel: string,
    ) {
      await user.click(
        screen.getByLabelText('Start date', {
          selector: `#experience-${index}-start`,
        }),
      )
      await user.selectOptions(
        screen.getByLabelText(`Experience ${index + 1} start date year`),
        year,
      )
      await user.click(screen.getByRole('button', { name: monthLabel }))
    }

    it('moves the edited entry newest first when a start date is committed', async () => {
      const user = userEvent.setup()
      const api = installMockApi({
        state: stateWithExperience([
          experienceEntry('exp-new', 'Newer Co', 'Aug 2022'),
          experienceEntry('exp-old', 'Older Co', 'Jan 2018'),
        ]),
      })
      await renderPage()

      expect(companies()).toEqual(['Newer Co', 'Older Co'])

      await pickStartDate(user, 1, '2024', 'March 2024')

      await waitFor(() => {
        expect(companies()).toEqual(['Older Co', 'Newer Co'])
      })
      expect(
        screen.getByText('Experience moved to position 1 of 2.'),
      ).toBeInTheDocument()

      const nav = screen.getByRole('navigation', {
        name: 'Work experience entries',
      })
      expect(
        within(nav).getByRole('link', { name: '1 · Older Co — Engineer' }),
      ).toHaveAttribute('href', '#profile-experience-entry-1')
      expect(
        within(nav).getByRole('link', { name: '2 · Newer Co — Staff' }),
      ).toHaveAttribute('href', '#profile-experience-entry-2')

      expect(
        api.calls.some(
          (call) => call.method === 'PUT' && call.path === '/api/profile',
        ),
      ).toBe(false)
    })

    it('treats an unfilled end date as ongoing and newest', async () => {
      const user = userEvent.setup()
      installMockApi({
        state: stateWithExperience([
          experienceEntry('exp-ended', 'Ended Co', 'Jan 2020', 'Jan 2021'),
          experienceEntry('exp-open', 'Open Co', 'Jan 2018'),
        ]),
      })
      await renderPage()

      expect(companies()).toEqual(['Ended Co', 'Open Co'])

      await pickStartDate(user, 1, '2018', 'January 2018')

      await waitFor(() => {
        expect(companies()).toEqual(['Open Co', 'Ended Co'])
      })
    })

    it('moves a project newest first when its end date is committed', async () => {
      const user = userEvent.setup()
      const api = installMockApi({
        state: stateWithProjects([
          projectEntry('project-alpha', 'Alpha', 'Jan 2020', 'Jan 2021'),
          projectEntry('project-beta', 'Beta', 'Jan 2018', 'Jan 2019'),
        ]),
      })
      await renderPage()

      expect(projectNames()).toEqual(['Alpha', 'Beta'])

      await user.click(
        screen.getByLabelText('End date', { selector: '#project-1-end' }),
      )
      await user.selectOptions(
        screen.getByLabelText('Project 2 end date year'),
        '2025',
      )
      await user.click(screen.getByRole('button', { name: 'March 2025' }))

      await waitFor(() => {
        expect(projectNames()).toEqual(['Beta', 'Alpha'])
      })
      expect(
        screen.getByText('Project moved to position 1 of 2.'),
      ).toBeInTheDocument()

      const nav = screen.getByRole('navigation', {
        name: 'Project entries',
      })
      expect(within(nav).getByRole('link', { name: '1 · Beta' })).toHaveAttribute(
        'href',
        '#profile-projects-entry-1',
      )
      expect(
        within(nav).getByRole('link', { name: '2 · Alpha' }),
      ).toHaveAttribute('href', '#profile-projects-entry-2')

      expect(
        api.calls.some(
          (call) => call.method === 'PUT' && call.path === '/api/profile',
        ),
      ).toBe(false)
    })

    it('keeps certifications ordered by issue date when an expiration changes', async () => {
      const user = userEvent.setup()
      const state = stateWithProfile()
      state.profile.certifications = [
        {
          id: 'cert-new',
          name: 'Newer cert',
          issuingOrganization: '',
          issueDate: 'Jan 2024',
          expirationDate: '',
          credentialId: '',
          credentialUrl: '',
          skillsGained: [],
        },
        {
          id: 'cert-old',
          name: 'Older cert',
          issuingOrganization: '',
          issueDate: 'Jan 2020',
          expirationDate: '',
          credentialId: '',
          credentialUrl: '',
          skillsGained: [],
        },
      ]
      const api = installMockApi({ state })
      await renderPage()

      const names = () =>
        screen
          .getAllByLabelText('Name', { selector: 'input[id$="-name"]' })
          .map((input) => (input as HTMLInputElement).value)

      await user.click(
        screen.getByLabelText('Expiration date (optional)', {
          selector: '#certification-1-expiration',
        }),
      )
      await user.selectOptions(
        screen.getByLabelText('Certification 2 expiration date year'),
        '2026',
      )
      await user.click(screen.getByRole('button', { name: 'March 2026' }))

      await waitFor(() => {
        expect(
          screen.getByLabelText('Expiration date (optional)', {
            selector: '#certification-1-expiration',
          }),
        ).toHaveTextContent('Mar 2026')
      })
      expect(names()).toEqual(['Newer cert', 'Older cert'])
      expect(
        api.calls.some(
          (call) => call.method === 'PUT' && call.path === '/api/profile',
        ),
      ).toBe(false)
    })

    it('saves entries newest first with undated entries last', async () => {
      const user = userEvent.setup()
      const api = installMockApi({
        state: stateWithExperience([
          experienceEntry('exp-old', 'Older Co', 'Jan 2018'),
          experienceEntry('exp-legacy', 'Legacy Co', 'Spring 2020'),
          experienceEntry('exp-new', 'Newer Co', 'Aug 2022'),
        ]),
      })
      await renderPage()

      await user.type(screen.getAllByLabelText('Company')[0], ' Inc')
      await user.click(screen.getByRole('button', { name: 'Save profile' }))

      expect(await screen.findByText('Saved')).toBeInTheDocument()
      await waitFor(() => {
        expect(
          api.state.profile.experience.map((entry) => entry.id),
        ).toEqual(['exp-new', 'exp-old', 'exp-legacy'])
      })
    })

    it('reviews entries newest first without saving the profile', async () => {
      const user = userEvent.setup()
      const api = installMockApi({
        state: stateWithExperience([
          experienceEntry('exp-old', 'Older Co', 'Jan 2018'),
          experienceEntry('exp-new', 'Newer Co', 'Aug 2022'),
        ]),
      })
      await renderPage()

      await user.click(screen.getByRole('button', { name: 'Review profile' }))
      await screen.findByText(/3 suggestions/)

      const reviewCall = api.calls.find(
        (call) => call.path === '/api/profile/review',
      )
      const reviewed = reviewCall?.body as {
        profile: JobriqState['profile']
      }
      expect(reviewed.profile.experience.map((entry) => entry.id)).toEqual([
        'exp-new',
        'exp-old',
      ])
      expect(
        api.calls.some(
          (call) => call.method === 'PUT' && call.path === '/api/profile',
        ),
      ).toBe(false)
    })

    it('sorts imported entries newest first', async () => {
      const user = userEvent.setup()
      const api = installMockApi()
      await renderPage()

      await user.click(screen.getByRole('button', { name: 'Import template' }))
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(within(dialog).getByLabelText('Template text'), {
        target: {
          value: [
            '[PERSONAL]',
            'Name: Jane Doe',
            'Email: jane@example.com',
            '',
            '[EXPERIENCE]',
            'Company: Older Co',
            'Title: Engineer',
            'Start: Jan 2018',
            '',
            '[EXPERIENCE]',
            'Company: Newer Co',
            'Title: Staff',
            'Start: Aug 2022',
          ].join('\n'),
        },
      })
      await user.click(
        within(dialog).getByRole('button', { name: 'Import profile' }),
      )

      expect(await screen.findByText('Saved')).toBeInTheDocument()
      await waitFor(() => {
        expect(
          api.state.profile.experience.map((entry) => entry.company),
        ).toEqual(['Newer Co', 'Older Co'])
      })
    })
  })
})
