import { expect, test } from '../../fixtures'
import { COVER_LETTER_FILE_NAME } from '../../support/patterns'

test('generates, downloads, and keeps a cover letter', async ({
  page,
  nav,
  profile,
  applications,
}) => {
  await profile.open()
  await profile.personal.fill({ name: 'Jane Doe', email: 'jane@example.com' })
  await profile.save()
  await profile.expectSaved()

  await nav.openApplications()
  await applications.addApplication('Globex', 'Senior Engineer')

  const dialog = await applications.writeCoverLetter(
    'Globex',
    'Senior Engineer',
  )
  await dialog.write()

  await dialog.expectText('Dear Globex Hiring Team,')
  await dialog.expectText(/The Senior Engineer role at Globex stood out/)
  await dialog.expectText('Sincerely,')

  const download = await dialog.downloadDocx()
  expect(download.suggestedFilename()).toMatch(COVER_LETTER_FILE_NAME)

  await dialog.regenerate()
  await dialog.expectText(/The Senior Engineer role at Globex stood out/)

  await dialog.close()
  await dialog.expectHidden()

  await page.reload()
  const reopened = await applications.viewCoverLetter(
    'Globex',
    'Senior Engineer',
  )
  await reopened.expectText('Dear Globex Hiring Team,')
})
