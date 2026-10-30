import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
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

    await user.click(screen.getByRole('button', { name: 'Remove skill TypeScript' }))
    expect(
      screen.queryByRole('button', { name: 'Remove skill TypeScript' }),
    ).not.toBeInTheDocument()
  })

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

    await user.click(screen.getByRole('button', { name: 'Add project' }))
    await user.type(
      screen.getByLabelText('Name', { selector: '#project-0-name' }),
      'Jobriq',
    )

    const association = screen.getByLabelText('Associated with (optional)')
    expect(
      within(association).getByRole('option', { name: 'Acme' }),
    ).toBeInTheDocument()
    expect(
      within(association).getByRole('option', { name: 'Personal Project' }),
    ).toBeInTheDocument()
    await user.selectOptions(association, 'Acme')

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
})
