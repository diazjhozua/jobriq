import { describe, expect, it } from 'vitest'
import { parseResumeTemplate } from './template'

const template = `
[PERSONAL]
Name: Jane Doe
Email: jane@example.com
Phone: 555-0100
Location: Remote
LinkedIn: linkedin.com/in/jane
GitHub: https://github.com/jane
Website:

[SUMMARY]
Type: objective
Content:

[EXPERIENCE]
Company: Acme
Title: Engineer
Start: Jan 2022
End: Present
- Built a thing
# ignored comment
- Shipped a tool

[EXPERIENCE]
Company: Globex
Title: Intern
Start: 2021
End: 2021
- Learned things

[EDUCATION]
School: State University
Degree: BSc
Field: Computer Science
Start: 2018
End: 2022
GPA: 3.9

[SKILLS]
C#, React, .NET

[PROJECT]
Name: Tool
URL: example.com/tool
Start: Aug 2022
End: Present
Associated: Acme
Description: |
  A small tool.
  Built to last.
- Shipped it

[JOB DESCRIPTION]
Ignored.

[AI SUGGESTIONS]
# ignored
`

describe('parseResumeTemplate', () => {
  it('maps every template section to the profile', () => {
    const profile = parseResumeTemplate(template)

    expect(profile.personal).toEqual({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '555-0100',
      location: 'Remote',
      linkedin: 'https://linkedin.com/in/jane',
      github: 'https://github.com/jane',
      website: '',
    })
    expect(profile.summaryType).toBe('objective')
    expect(profile.summary).toBe('')
    expect(profile.experience).toHaveLength(2)
    expect(profile.experience[0]?.company).toBe('Acme')
    expect(profile.experience[0]?.bullets).toEqual(['Built a thing', 'Shipped a tool'])
    expect(profile.education[0]?.gpa).toBe('3.9')
    expect(profile.skills).toEqual(['C#', 'React', '.NET'])
    expect(profile.certifications).toEqual([])
    expect(profile.awards).toEqual([])
    expect(profile.projects[0]).toMatchObject({
      name: 'Tool',
      url: 'https://example.com/tool',
      startDate: 'Aug 2022',
      endDate: 'Present',
      associatedWith: 'Acme',
      description: 'A small tool.\nBuilt to last.',
      bullets: ['Shipped it'],
    })
  })

  it('keeps blank lines inside a description block and ignores indented bullets', () => {
    const profile = parseResumeTemplate(`
[PROJECT]
Name: Tool
Description: |
  First paragraph.
  - not a bullet

  Second paragraph.
- Real bullet
`)

    expect(profile.projects[0]?.description).toBe(
      'First paragraph.\n- not a bullet\n\nSecond paragraph.',
    )
    expect(profile.projects[0]?.bullets).toEqual(['Real bullet'])
  })

  it('accepts an indented description block', () => {
    const profile = parseResumeTemplate(`
[PROJECT]
  Name: Tool
  Description: |
    A small tool.
  - Shipped it
`)

    expect(profile.projects[0]?.description).toBe('A small tool.')
    expect(profile.projects[0]?.bullets).toEqual(['Shipped it'])
  })

  it('accepts a legacy inline description and defaults a missing one to empty', () => {
    const inline = parseResumeTemplate(`
[PROJECT]
Name: Tool
Description: A one-line tool.
- Shipped it
`)
    const missing = parseResumeTemplate(`
[PROJECT]
Name: Tool
- Shipped it
`)

    expect(inline.projects[0]?.description).toBe('A one-line tool.')
    expect(inline.projects[0]?.bullets).toEqual(['Shipped it'])
    expect(missing.projects[0]?.description).toBe('')
  })

  it('generates ids for repeatable entries', () => {
    const profile = parseResumeTemplate(template)

    expect(profile.experience[0]?.id).not.toBe('')
    expect(profile.experience[0]?.id).not.toBe(profile.experience[1]?.id)
    expect(profile.education[0]?.id).not.toBe('')
    expect(profile.projects[0]?.id).not.toBe('')
  })

  it('rejects text without template sections', () => {
    expect(() => parseResumeTemplate('just some text')).toThrow(
      'No template sections found.',
    )
  })
})
