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
    expect(profile.projects[0]).toMatchObject({
      name: 'Tool',
      url: 'https://example.com/tool',
      bullets: ['Shipped it'],
    })
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
