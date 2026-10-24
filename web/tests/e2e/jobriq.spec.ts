import { expect, test } from '@playwright/test'

const fileNamePattern = /^jane-doe-resume-\d{8}-\d{6}\.(md|docx)$/

test('profile, application, generation, and downloads', async ({ page }) => {
  await page.goto('/profile')

  await page.getByLabel('Name').fill('Jane Doe')
  await page.getByLabel('Email').fill('jane@example.com')
  await page.getByLabel('Location').fill('Remote')

  await page.getByRole('button', { name: 'Add experience' }).click()
  await page.getByLabel('Company').fill('Acme')
  await page.getByLabel('Title').fill('Engineer')
  await page.getByLabel('Start date').first().fill('2022')
  await page.getByLabel('End date').first().fill('Present')
  await page.getByLabel('Bullets').fill('Built a thing')

  await page.getByLabel('Skills').fill('C#, React')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByRole('status')).toContainText('Saved')

  await page.reload()
  await expect(page.getByLabel('Name')).toHaveValue('Jane Doe')
  await expect(page.getByLabel('Company')).toHaveValue('Acme')
  await expect(page.getByLabel('Skills')).toHaveValue('C#, React')

  await page.getByRole('link', { name: 'Applications' }).click()
  await expect(page.getByText('No applications yet')).toBeVisible()

  await page.getByRole('button', { name: 'Add application' }).click()
  const addDialog = page.getByRole('dialog')
  await addDialog.getByLabel('Company').fill('Globex')
  await addDialog.getByLabel('Role').fill('Senior Engineer')
  await addDialog
    .getByLabel('Job description')
    .fill('Build reliable systems with C# and React. Kubernetes is a plus.')
  await addDialog.getByRole('button', { name: 'Add application' }).click()

  await expect(page.getByText('Globex')).toBeVisible()
  await expect(page.getByText('Senior Engineer')).toBeVisible()

  await page.getByRole('button', { name: 'Generate resume' }).click()
  const resumeDialog = page.getByRole('dialog')
  await resumeDialog.getByRole('button', { name: 'Generate resume' }).click()

  await expect(resumeDialog.getByText('Deterministic professional summary.')).toBeVisible()
  await expect(resumeDialog.getByText('Enhanced: Built a thing')).toBeVisible()
  await expect(resumeDialog.getByText('Kubernetes')).toBeVisible()

  const markdownDownload = page.waitForEvent('download')
  await resumeDialog.getByRole('button', { name: 'Markdown' }).click()
  expect((await markdownDownload).suggestedFilename()).toMatch(fileNamePattern)

  const docxDownload = page.waitForEvent('download')
  await resumeDialog.getByRole('button', { name: 'DOCX' }).click()
  expect((await docxDownload).suggestedFilename()).toMatch(fileNamePattern)

  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByText('Resume generated')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Resume generated')).toBeVisible()
  await page.getByRole('button', { name: 'View resume' }).click()
  await expect(page.getByRole('dialog').getByText('Enhanced: Built a thing')).toBeVisible()
})
