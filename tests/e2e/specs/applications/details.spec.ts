import { test } from '../../fixtures'

test('edits an application and sets its applied date', async ({
  page,
  applications,
}) => {
  await applications.open()
  await applications.addApplication('Globex', 'Senior Engineer')

  const dialog = await applications.edit('Globex', 'Senior Engineer')
  await dialog.setAppliedDate('August', '2022')
  await dialog.saveChanges()
  await dialog.expectHidden()

  await applications.expectApplied('Aug 2022')

  await page.reload()
  await applications.expectApplied('Aug 2022')
})

test('persists an application status change', async ({
  page,
  applications,
}) => {
  await applications.open()
  await applications.addApplication('Initech', 'Developer')

  await applications.row('Initech', 'Developer').setStatus('interviewing')

  await page.reload()
  await applications.expectApplication('Initech')
  await applications
    .row('Initech', 'Developer')
    .expectStatus('interviewing')
})

test('persists an application deletion', async ({ page, applications }) => {
  await applications.open()
  await applications.addApplication('Umbrella', 'Engineer')

  await applications.delete('Umbrella', 'Engineer')

  await applications.expectEmpty()

  await page.reload()
  await applications.expectEmpty()
  await applications.expectNoApplication('Umbrella')
})
