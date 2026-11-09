import { expect, test } from '../../fixtures'
import {
  expectComboboxOption,
  typeComboboxValue,
} from '../../support/combobox'
import { RESUME_FILE_NAME } from '../../support/patterns'

test('captures project dates and the associated company', async ({
  page,
  profile,
}) => {
  await profile.open()

  await profile.personal.fill({ name: 'Jane Doe', email: 'jane@example.com' })

  await profile.entries.addExperience()
  await profile.entries.fillExperience(1, {
    company: 'Acme',
    title: 'Engineer',
  })

  await profile.entries.addEducation()
  await profile.entries.fillEducation(1, { school: 'State University' })

  await profile.entries.addProject()
  await profile.entries.fillProject(1, {
    name: 'Jobriq',
    description: 'A resume builder for tracking applications.',
  })

  await profile.entries
    .comboboxField('Project', 1, 'Associated with')
    .click()
  await expectComboboxOption(page, 'State University')
  await expectComboboxOption(page, 'Personal Project')
  await page.getByRole('option', { name: 'Acme' }).click()

  await profile.entries.pickStart('Project', 1, 'August', '2022')
  await profile.entries.pickEndPresent('Project', 1)

  await profile.entries.expectNav('1 · Jobriq — Acme')

  await profile.save()
  await profile.expectSaved()

  await page.reload()
  await profile.entries.expectDateField('Project', 1, 'Start date', 'Aug 2022')
  await profile.entries.expectDateField('Project', 1, 'End date', 'Present')
  await profile.entries.expectComboboxValue(
    'Project',
    1,
    'Associated with',
    'Acme',
  )
  await profile.entries.expectLooseFieldValue(
    'Project',
    1,
    'Description',
    'A resume builder for tracking applications.',
  )
})

test('captures certifications and awards in the generated resume', async ({
  page,
  profile,
}) => {
  await profile.open()

  await profile.personal.fill({ name: 'Jane Doe', email: 'jane@example.com' })

  await profile.entries.addEducation()
  await profile.entries.fillEducation(1, { school: 'State University' })

  await profile.entries.addCertification()
  await profile.entries.fillCertification(1, {
    name: 'AWS Solutions Architect',
    issuer: 'Amazon Web Services',
    credentialId: 'ABC-123',
    credentialUrl: 'https://example.com/verify/ABC-123',
  })
  await page.keyboard.press('Escape')
  await profile.entries.pickIssueDate('Certification', 1, 'March', '2024')

  await profile.entries.addAward()
  await profile.entries.fillAward(1, { title: 'Engineer of the Year' })

  await profile.entries.comboboxField('Award', 1, 'Associated with').click()
  await expectComboboxOption(page, 'State University')
  await page.keyboard.press('Escape')
  await typeComboboxValue(
    page,
    profile.entries.comboboxField('Award', 1, 'Associated with'),
    'Acme',
  )

  await profile.entries.field('Award', 1, 'Issuer').click()
  await expectComboboxOption(page, 'Amazon Web Services')
  await page.keyboard.press('Escape')
  await typeComboboxValue(
    page,
    profile.entries.field('Award', 1, 'Issuer'),
    'IEEE',
  )

  await profile.entries.pickIssueDate('Award', 1, 'December', '2023')
  await profile.entries
    .field('Award', 1, 'Description')
    .fill('Recognized for reliability work.')

  await profile.entries.expectNav(
    '1 · AWS Solutions Architect — Amazon Web Services',
  )

  await profile.save()
  await profile.expectSaved()

  await page.reload()
  await profile.entries.expectFieldValue(
    'Certification',
    1,
    'Name',
    'AWS Solutions Architect',
  )
  await profile.entries.expectDateField(
    'Certification',
    1,
    'Issue date',
    'Mar 2024',
  )
  await profile.entries.expectFieldValue(
    'Award',
    1,
    'Title',
    'Engineer of the Year',
  )
  await profile.entries.expectDateField('Award', 1, 'Issue date', 'Dec 2023')

  const dialog = await profile.openResume()
  await dialog.generate()

  await dialog.expectText('Licenses & certifications')
  await dialog.expectText('AWS Solutions Architect — Amazon Web Services')
  await dialog.expectText('Credential ID: ABC-123')
  await dialog.expectText('Honors & awards')
  await dialog.expectText('Engineer of the Year — IEEE')
  await dialog.expectText('Dec 2023 · Acme')
  await dialog.expectText('Recognized for reliability work.')

  const markdown = await dialog.downloadMarkdown()
  expect(markdown.suggestedFilename()).toMatch(RESUME_FILE_NAME)
})
