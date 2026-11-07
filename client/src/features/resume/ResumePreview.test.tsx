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
  certifications: [],
  awards: [],
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

  it('does not render per-entry skills gained', () => {
    render(
      <ResumePreview
        resume={{
          ...resume,
          education: [
            {
              id: 'education-1',
              school: 'State University',
              degree: 'BSc',
              field: 'Computer Science',
              startDate: '',
              endDate: '',
              gpa: '',
              skillsGained: ['gained-only-skill'],
            },
          ],
        }}
      />,
    )

    expect(screen.queryByText(/gained-only-skill/)).not.toBeInTheDocument()
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
              description: '',
              bullets: [],
            },
          ],
        }}
      />,
    )

    expect(screen.getByText('Aug 2022 – Present · Acme')).toBeInTheDocument()
  })

  it('renders certifications and awards with their metadata', () => {
    render(
      <ResumePreview
        resume={{
          ...resume,
          certifications: [
            {
              id: 'cert-1',
              name: 'AWS Solutions Architect',
              issuingOrganization: 'Amazon Web Services',
              issueDate: 'Mar 2024',
              expirationDate: 'Mar 2027',
              credentialId: 'ABC-123',
              credentialUrl: 'https://example.com/verify/ABC-123',
              skillsGained: [],
            },
          ],
          awards: [
            {
              id: 'award-1',
              title: 'Engineer of the Year',
              associatedWith: 'Acme',
              issuer: 'IEEE',
              issueDate: 'Dec 2023',
              description: 'Recognized for reliability work.',
            },
          ],
        }}
      />,
    )

    expect(screen.getByText('Licenses & certifications')).toBeInTheDocument()
    expect(
      screen.getByText('AWS Solutions Architect — Amazon Web Services'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Mar 2024 – Mar 2027 · Credential ID: ABC-123'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('https://example.com/verify/ABC-123'),
    ).toBeInTheDocument()
    expect(screen.getByText('Honors & awards')).toBeInTheDocument()
    expect(screen.getByText('Engineer of the Year — IEEE')).toBeInTheDocument()
    expect(screen.getByText('Dec 2023 · Acme')).toBeInTheDocument()
    expect(
      screen.getByText('Recognized for reliability work.'),
    ).toBeInTheDocument()
  })

  it('omits certification and award sections when empty', () => {
    render(<ResumePreview resume={resume} />)

    expect(
      screen.queryByText('Licenses & certifications'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Honors & awards')).not.toBeInTheDocument()
  })

  it('renders the project description between metadata and bullets', () => {
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
              description: 'A resume builder.',
              bullets: [
                { original: 'Made it', enhanced: 'Enhanced: Made it' },
              ],
            },
          ],
        }}
      />,
    )

    const description = screen.getByText('A resume builder.')
    const bullet = screen.getByText('Enhanced: Made it')

    expect(
      description.compareDocumentPosition(bullet) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
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
              description: '',
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
