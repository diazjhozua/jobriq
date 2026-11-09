import { expect, test } from '../../fixtures'
import { RESUME_FILE_NAME } from '../../support/patterns'

test('profile, application, generation, and downloads', async ({
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

  await page.reload()
  await profile.personal.expectField('Name', 'Jane Doe')
  await profile.entries.expectFieldValue('Experience', 1, 'Company', 'Acme')
  await profile.skills.expectTag('C#')

  await nav.openApplications()
  await applications.expectEmpty()

  await applications.addApplication('Globex', 'Senior Engineer')
  await applications.expectRole('Senior Engineer')

  await applications.expectDescription('Build reliable systems.', false)
  await applications.toggleDescription('Globex', 'Senior Engineer')
  await applications.expectDescription('Build reliable systems.', true)
  await applications.toggleDescription('Globex', 'Senior Engineer')
  await applications.expectDescription('Build reliable systems.', false)

  const dialog = await applications.generateResume(
    'Globex',
    'Senior Engineer',
  )
  await dialog.generate()

  await dialog.expectText('Deterministic professional summary.')
  await dialog.expectText('Enhanced: Built a thing')
  await dialog.expectText('Kubernetes')

  const markdown = await dialog.downloadMarkdown()
  expect(markdown.suggestedFilename()).toMatch(RESUME_FILE_NAME)

  const docx = await dialog.downloadDocx()
  expect(docx.suggestedFilename()).toMatch(RESUME_FILE_NAME)

  await dialog.close()
  await expect(
    applications.row('Globex', 'Senior Engineer').viewResumeButton(),
  ).toBeVisible()

  await page.reload()
  await expect(
    applications.row('Globex', 'Senior Engineer').viewResumeButton(),
  ).toBeVisible()

  const reopened = await applications.viewResume('Globex', 'Senior Engineer')
  await reopened.expectText('Enhanced: Built a thing')
})
