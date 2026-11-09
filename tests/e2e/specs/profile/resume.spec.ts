import { expect, test } from '../../fixtures'
import { RESUME_FILE_NAME } from '../../support/patterns'

test('generates and keeps a standalone resume without an application', async ({
  page,
  nav,
  profile,
  applications,
}) => {
  await profile.open()

  await profile.personal.fill({
    name: 'Jane Doe',
    email: 'jane@example.com',
    location: 'Remote',
  })
  await profile.entries.addExperience()
  await profile.entries.fillExperience(1, {
    company: 'Acme',
    title: 'Engineer',
  })
  await profile.entries.pickStart('Experience', 1, 'August', '2022')
  await profile.entries.pickEndPresent('Experience', 1)
  await profile.entries.fillBullet('Experience', 1, 1, 'Built a thing')
  await profile.skills.add(['C#, React'])
  await profile.save()
  await profile.expectSaved()

  let dialog = await profile.openResume()
  await dialog.generate()

  await dialog.expectText('Deterministic professional summary.')
  await dialog.expectText('Enhanced: Built a thing')
  await dialog.expectTextCount('Kubernetes', 0)

  const markdown = await dialog.downloadMarkdown()
  expect(markdown.suggestedFilename()).toMatch(RESUME_FILE_NAME)

  const docx = await dialog.downloadDocx()
  expect(docx.suggestedFilename()).toMatch(RESUME_FILE_NAME)

  await dialog.close()
  await dialog.expectHidden()

  await page.reload()
  dialog = await profile.openResume()
  await dialog.expectText('Deterministic professional summary.')
  await dialog.expectText('Enhanced: Built a thing')

  await dialog.close()
  await nav.openApplications()
  await applications.expectEmpty()
})
