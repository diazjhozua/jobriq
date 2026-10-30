import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { GeneratedResume } from '../../lib/types'
import { ResumePreview } from './ResumePreview'

const resume: GeneratedResume = {
  personal: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
  },
  summary: 'Backend engineer.',
  experience: [
    {
      id: 'exp-1',
      company: 'Acme',
      title: 'Engineer',
      startDate: '2022',
      endDate: 'Present',
      bullets: [
        {
          original: 'Shipped the billing service',
          enhanced: 'Shipped the billing service.',
        },
      ],
    },
  ],
  education: [],
  skills: ['C#'],
  projects: [],
  keywords: { matched: ['C#'], missing: [] },
  generatedAt: '2026-10-24T12:00:00.000Z',
}

describe('ResumePreview', () => {
  it('renders bullets without quantification prompts', () => {
    render(<ResumePreview resume={resume} />)

    expect(screen.getByText('Shipped the billing service.')).toBeInTheDocument()
    expect(screen.queryByText(/quantif/i)).not.toBeInTheDocument()
  })

  it('renders project dates and the associated company', () => {
    render(
      <ResumePreview
        resume={{
          ...resume,
          projects: [
            {
              id: 'project-1',
              name: 'Jobriq',
              url: null,
              startDate: 'Aug 2022',
              endDate: 'Present',
              associatedWith: 'Acme',
              bullets: [],
            },
          ],
        }}
      />,
    )

    expect(screen.getByText('Aug 2022 – Present · Acme')).toBeInTheDocument()
  })

  it('omits the project metadata line when it is empty', () => {
    render(
      <ResumePreview
        resume={{
          ...resume,
          projects: [
            {
              id: 'project-1',
              name: 'Jobriq',
              url: null,
              startDate: '',
              endDate: '',
              associatedWith: '',
              bullets: [],
            },
          ],
        }}
      />,
    )

    expect(screen.getByText('Jobriq')).toBeInTheDocument()
    expect(screen.queryByText(/·/)).not.toBeInTheDocument()
  })
})
