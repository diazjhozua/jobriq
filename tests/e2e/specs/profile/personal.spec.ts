import { expect, test } from '../../fixtures'
import { downloadText } from '../../support/downloads'
import { PROFILE_FILE_NAME } from '../../support/patterns'

test('imports a pasted resume template', async ({ page, profile }) => {
  await profile.open()
  await profile.importTemplate(
    [
      '[PERSONAL]',
      'Name: Imported Person',
      'Email: imported@example.com',
      'LinkedIn: linkedin.com/in/imported',
      '',
      '[SUMMARY]',
      'Type: professional',
      'Content:',
      '',
      '[EXPERIENCE]',
      'Company: Acme',
      'Title: Engineer',
      'Start: 2022',
      'End: Present',
      '- Built a thing',
      '',
      '[SKILLS]',
      'C#, React',
    ].join('\n'),
  )

  await profile.personal.expectField('Name', 'Imported Person')
  await profile.personal.expectField('LinkedIn', 'https://linkedin.com/in/imported')
  await profile.skills.expectTag('C#')
  await profile.skills.expectTag('React')
  await profile.entries.expectFieldValue('Experience', 1, 'Company', 'Acme')

  await page.reload()
  await profile.personal.expectField('Name', 'Imported Person')
  await profile.entries.expectFieldValue('Experience', 1, 'Company', 'Acme')
})

test('exports the current profile as an import template', async ({ profile }) => {
  await profile.open()

  await profile.personal.field('Name').fill('Jane Doe')
  await profile.personal.field('Email').fill('jane@example.com')

  const download = await profile.exportProfile()

  expect(download.suggestedFilename()).toMatch(PROFILE_FILE_NAME)

  const content = await downloadText(download)
  expect(content).toContain('[PERSONAL]')
  expect(content).toContain('Name: Jane Doe')
  expect(content).toContain('Email: jane@example.com')
})

test('ignores legacy localStorage data', async ({ page, nav, profile, applications }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'jobriq.v1',
      JSON.stringify({
        version: 1,
        profile: {
          personal: {
            name: 'Legacy Person',
            email: 'legacy@example.com',
            phone: '',
            location: '',
            linkedin: '',
            github: '',
            website: '',
          },
          summary: { type: 'professional', content: 'Legacy summary.' },
          experience: [],
          education: [],
          skills: ['Legacy Skill'],
          projects: [],
        },
        applications: [
          {
            id: 'legacy-application',
            company: 'Legacy Corp',
            role: 'Legacy Role',
            jobDescription: 'Legacy description.',
            status: 'offer',
            createdAt: '2020-01-01T00:00:00.000Z',
          },
        ],
      }),
    )
  })

  await profile.open()

  await profile.personal.expectField('Name', '')
  await profile.personal.expectField('Email', '')
  await profile.expectSkillInputValue('')

  await nav.openApplications()
  await applications.expectEmpty()
  await applications.expectNoApplication('Legacy Corp')
})
