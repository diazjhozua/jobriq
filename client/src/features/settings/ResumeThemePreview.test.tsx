import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { themeStyles } from '../../test/resumeThemes'
import { ResumeThemePreview } from './ResumeThemePreview'

const customStyles = themeStyles({
  nameFont: 'Georgia',
  bodyFont: 'Cambria',
  textColor: '#112233',
  mutedColor: '#445566',
  headingColor: '#778899',
  ruleColor: '#AABBCC',
  bodySize: 11,
  smallSize: 10,
  headingSize: 13,
  nameSize: 20,
  pageMargin: 54,
  showRules: true,
})

describe('ResumeThemePreview', () => {
  it('renders the sample resume with the theme typography', () => {
    render(<ResumeThemePreview styles={customStyles} />)

    expect(screen.getByText('Jane Doe')).toHaveStyle({
      fontFamily: 'Georgia',
      fontWeight: '700',
      color: 'rgb(119, 136, 153)',
    })

    const contact = screen.getByText(/jane\.doe@example\.com/)
    expect(contact.textContent).toContain('  |  ')
    expect(contact).toHaveStyle({ color: 'rgb(68, 85, 102)' })

    const heading = screen.getByText('Work Experience')
    expect(heading).toHaveStyle({ fontWeight: '700' })
    expect(heading.style.textTransform).toBe('')

    expect(screen.getByText('Professional Summary')).toBeInTheDocument()
    expect(screen.getByText('Education')).toBeInTheDocument()
    expect(screen.getByText('Licenses & Certifications')).toBeInTheDocument()
    expect(screen.getByText('Honors & Awards')).toBeInTheDocument()
    expect(screen.getByText('Skills')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
  })

  it('scales every size against the letter width', () => {
    const { container } = render(<ResumeThemePreview styles={customStyles} />)

    const page = container.querySelector('[data-theme-page]')
    expect(page).not.toBeNull()
    expect((page as HTMLElement).style.padding).toContain('cqw')

    const name = screen.getByText('Jane Doe')
    expect(name.style.fontSize).toContain('cqw')
  })

  it('places dates inline and entry metadata on its own line', () => {
    render(<ResumeThemePreview styles={customStyles} />)

    const experience = screen.getByText('Senior Software Engineer — Acme')
    expect(experience.closest('p')?.textContent).toContain('Mar 2021 – Present')

    const certification = screen.getByText(
      'AWS Certified Solutions Architect — Amazon Web Services',
    )
    expect(certification.closest('p')?.textContent).not.toContain('Credential ID')

    const meta = screen.getByText(/Credential ID: AWS-12345/)
    expect(meta.closest('p')).not.toBe(certification.closest('p'))
    expect(meta).toHaveStyle({ color: 'rgb(68, 85, 102)' })

    expect(screen.getByText('GPA: 3.8')).toHaveStyle({
      color: 'rgb(68, 85, 102)',
    })
  })

  it('draws one rule per section when the theme shows rules', () => {
    const { container } = render(<ResumeThemePreview styles={customStyles} />)

    expect(container.querySelectorAll('[data-theme-rule]')).toHaveLength(7)
    expect(container.querySelectorAll('ul > li').length).toBeGreaterThan(0)
  })

  it('omits rules when the theme disables them', () => {
    const { container } = render(
      <ResumeThemePreview styles={{ ...customStyles, showRules: false }} />,
    )

    expect(container.querySelectorAll('[data-theme-rule]')).toHaveLength(0)
  })
})
