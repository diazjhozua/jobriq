import { expect, test, type Page } from '@playwright/test'

const fileNamePattern = /^jane-doe-resume-\d{8}-\d{6}\.(md|docx)$/

async function addApplication(page: Page, company: string, role: string) {
  await page.getByRole('button', { name: 'Add application' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Company').fill(company)
  await dialog.getByLabel('Role').fill(role)
  await dialog.getByLabel('Job description').fill('Build reliable systems.')
  await dialog.getByRole('button', { name: 'Add application' }).click()

  await expect(dialog).toBeHidden()
  await expect(page.getByText(company, { exact: true })).toBeVisible()
}

test('imports a pasted resume template', async ({ page }) => {
  await page.goto('/profile')

  await page.getByRole('button', { name: 'Import template' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Template text').fill(
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
  await dialog.getByRole('button', { name: 'Import profile' }).click()

  await expect(dialog).toBeHidden()
  await expect(page.getByLabel('Name')).toHaveValue('Imported Person')
  await expect(page.getByLabel('LinkedIn')).toHaveValue(
    'https://linkedin.com/in/imported',
  )
  await expect(page.getByRole('button', { name: 'Remove skill C#' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remove skill React' })).toBeVisible()
  await expect(page.getByLabel('Company')).toHaveValue('Acme')

  await page.reload()
  await expect(page.getByLabel('Name')).toHaveValue('Imported Person')
  await expect(page.getByLabel('Company')).toHaveValue('Acme')
})

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
  await page
    .getByRole('textbox', { name: 'Experience 1 bullet 1', exact: true })
    .fill('Built a thing')

  await page.getByLabel('Skills').fill('C#, React')
  await page.getByLabel('Skills').press('Enter')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('Name')).toHaveValue('Jane Doe')
  await expect(page.getByLabel('Company')).toHaveValue('Acme')
  await expect(page.getByRole('button', { name: 'Remove skill C#' })).toBeVisible()

  await page.getByRole('link', { name: 'Applications' }).click()
  await expect(page.getByText('No applications yet')).toBeVisible()

  await addApplication(page, 'Globex', 'Senior Engineer')
  await expect(page.getByText('Senior Engineer', { exact: true })).toBeVisible()

  await expect(page.getByText('Build reliable systems.')).toBeHidden()
  await page
    .getByRole('button', { name: 'View description for Senior Engineer at Globex' })
    .click()
  await expect(page.getByText('Build reliable systems.')).toBeVisible()
  await page
    .getByRole('button', { name: 'Hide description for Senior Engineer at Globex' })
    .click()
  await expect(page.getByText('Build reliable systems.')).toBeHidden()

  await page
    .getByRole('button', { name: 'Generate resume for Senior Engineer at Globex' })
    .click()
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
  await expect(page.getByRole('button', {
    name: 'View resume for Senior Engineer at Globex',
  })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', {
    name: 'View resume for Senior Engineer at Globex',
  })).toBeVisible()
  await page.getByRole('button', {
    name: 'View resume for Senior Engineer at Globex',
  }).click()
  await expect(page.getByRole('dialog').getByText('Enhanced: Built a thing')).toBeVisible()
})

test('generates and keeps a standalone resume without an application', async ({
  page,
}) => {
  await page.goto('/profile')

  await page.getByLabel('Name').fill('Jane Doe')
  await page.getByLabel('Email').fill('jane@example.com')
  await page.getByLabel('Location').fill('Remote')
  await page.getByRole('button', { name: 'Add experience' }).click()
  await page.getByLabel('Company').fill('Acme')
  await page.getByLabel('Title').fill('Engineer')
  await page.getByLabel('Start date').first().fill('2022')
  await page.getByLabel('End date').first().fill('Present')
  await page
    .getByRole('textbox', { name: 'Experience 1 bullet 1', exact: true })
    .fill('Built a thing')
  await page.getByLabel('Skills').fill('C#, React')
  await page.getByLabel('Skills').press('Enter')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Resume', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Generate resume' }).click()

  await expect(dialog.getByText('Deterministic professional summary.')).toBeVisible()
  await expect(dialog.getByText('Enhanced: Built a thing')).toBeVisible()
  await expect(dialog.getByText('Kubernetes')).toHaveCount(0)

  const markdownDownload = page.waitForEvent('download')
  await dialog.getByRole('button', { name: 'Markdown' }).click()
  expect((await markdownDownload).suggestedFilename()).toMatch(fileNamePattern)

  const docxDownload = page.waitForEvent('download')
  await dialog.getByRole('button', { name: 'DOCX' }).click()
  expect((await docxDownload).suggestedFilename()).toMatch(fileNamePattern)

  await page.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toBeHidden()

  await page.reload()
  await page.getByRole('button', { name: 'Resume', exact: true }).click()
  await expect(
    page.getByRole('dialog').getByText('Deterministic professional summary.'),
  ).toBeVisible()
  await expect(
    page.getByRole('dialog').getByText('Enhanced: Built a thing'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('link', { name: 'Applications' }).click()
  await expect(page.getByText('No applications yet')).toBeVisible()
})

test('generates, downloads, and keeps a cover letter', async ({ page }) => {
  await page.goto('/profile')
  await page.getByLabel('Name').fill('Jane Doe')
  await page.getByLabel('Email').fill('jane@example.com')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Applications' }).click()
  await addApplication(page, 'Globex', 'Senior Engineer')

  await page
    .getByRole('button', { name: 'Write cover letter for Senior Engineer at Globex' })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Write cover letter' }).click()

  await expect(dialog.getByText('Dear Globex Hiring Team,')).toBeVisible()
  await expect(
    dialog.getByText(/The Senior Engineer role at Globex stood out/),
  ).toBeVisible()
  await expect(dialog.getByText('Sincerely,')).toBeVisible()

  const download = page.waitForEvent('download')
  await dialog.getByRole('button', { name: 'Download DOCX' }).click()
  expect((await download).suggestedFilename()).toMatch(
    /^jane-doe-cover-letter-\d{8}-\d{6}\.docx$/,
  )

  await dialog.getByRole('button', { name: 'Regenerate' }).click()
  await expect(
    dialog.getByText(/The Senior Engineer role at Globex stood out/),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toBeHidden()

  await page.reload()
  await page
    .getByRole('button', { name: 'View cover letter for Senior Engineer at Globex' })
    .click()
  await expect(
    page.getByRole('dialog').getByText('Dear Globex Hiring Team,'),
  ).toBeVisible()
})

test('persists an application status change', async ({ page }) => {
  await page.goto('/applications')
  await addApplication(page, 'Initech', 'Developer')

  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH' &&
      response.url().includes('/status') &&
      response.ok(),
  )
  await page.getByLabel('Status for Developer at Initech').selectOption('interviewing')
  await saved

  await page.reload()
  await expect(page.getByText('Initech', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Status for Developer at Initech')).toHaveValue('interviewing')
})

test('persists an application deletion', async ({ page }) => {
  await page.goto('/applications')
  await addApplication(page, 'Umbrella', 'Engineer')

  await page.getByRole('button', { name: 'Delete Engineer at Umbrella' }).click()
  const dialog = page.getByRole('alertdialog')
  const deleted = page.waitForResponse(
    (response) => response.request().method() === 'DELETE' && response.ok(),
  )
  await dialog.getByRole('button', { name: 'Delete' }).click()
  await deleted

  await expect(page.getByText('No applications yet')).toBeVisible()

  await page.reload()
  await expect(page.getByText('No applications yet')).toBeVisible()
  await expect(page.getByText('Umbrella')).toHaveCount(0)
})

test('keeps the application table usable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 })
  await page.goto('/applications')
  await addApplication(page, 'Globex', 'Senior Engineer')

  await expect(page.locator('thead th', { hasText: 'Added' })).toBeHidden()
  await expect(page.getByLabel('Status for Senior Engineer at Globex')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'View description for Senior Engineer at Globex' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Generate resume for Senior Engineer at Globex' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Write cover letter for Senior Engineer at Globex' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Delete Senior Engineer at Globex' }),
  ).toBeVisible()

  await expect(page.getByText(/^Added /)).toBeVisible()

  await page
    .getByRole('button', { name: 'View description for Senior Engineer at Globex' })
    .click()
  await expect(page.getByText('Build reliable systems.')).toBeVisible()

  const overflow = await page.evaluate(() => {
    const table = document.querySelector('table')
    const card = table?.parentElement
    return {
      card: card ? card.scrollWidth - card.clientWidth : -1,
      document:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
  expect(overflow).toEqual({ card: 0, document: 0 })
})

test('keeps the profile header and resume dialog usable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 })
  await page.goto('/profile')

  await expect(
    page.getByRole('button', { name: 'Resume', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Save profile' }),
  ).toBeVisible()

  const headerOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(headerOverflow).toBe(0)

  await page.getByRole('button', { name: 'Resume', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  const dialogOverflow = await page.evaluate(() => {
    const content = document.querySelector('[role="dialog"]')
    return content ? content.scrollWidth - content.clientWidth : -1
  })
  expect(dialogOverflow).toBe(0)
})

test('reviews the profile, applies a suggestion, and keeps the review in session', async ({
  page,
}) => {
  await page.goto('/profile')

  await page.getByLabel('Name').fill('Jane Doe')
  await page.getByLabel('Email').fill('jane@example.com')
  await page.getByRole('button', { name: 'Add experience' }).click()
  await page.getByLabel('Company').fill('Acme')
  await page.getByLabel('Title').fill('Engineer')
  await page
    .getByRole('textbox', { name: 'Experience 1 bullet 1', exact: true })
    .fill('Built a thing')

  await page.getByRole('button', { name: 'Review profile' }).click()

  await expect(page.getByText('Deterministic reviewed summary.')).toBeVisible()
  await expect(page.getByText('Reviewed: Built a thing')).toBeVisible()
  await expect(page.getByText('Group related skills')).toBeVisible()

  await page
    .getByRole('button', {
      name: 'Apply suggestion: Add a professional summary',
    })
    .click()

  const summary = page.getByRole('textbox', { name: 'Summary' })
  await expect(summary).toHaveValue('Deterministic reviewed summary.')
  await expect(page.getByRole('button', { name: 'Save profile' })).toBeEnabled()

  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Applications' }).click()
  await page.getByRole('link', { name: 'Profile' }).click()
  await expect(page.getByText('Add a professional summary')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Summary' })).toHaveValue(
    'Deterministic reviewed summary.',
  )
  await expect(page.getByText('Add a professional summary')).toHaveCount(0)
})

test('ignores legacy localStorage data', async ({ page }) => {
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

  await page.goto('/profile')

  await expect(
    page.getByRole('heading', { name: 'Profile', exact: true }),
  ).toBeVisible()
  await expect(page.getByLabel('Name')).toHaveValue('')
  await expect(page.getByLabel('Email')).toHaveValue('')
  await expect(page.getByLabel('Skills')).toHaveValue('')

  await page.getByRole('link', { name: 'Applications' }).click()
  await expect(page.getByText('No applications yet')).toBeVisible()
  await expect(page.getByText('Legacy Corp')).toHaveCount(0)
})
