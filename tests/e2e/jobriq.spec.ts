import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

const fileNamePattern = /^jane-doe-resume-\d{8}-\d{6}\.(md|docx)$/
const profileFileNamePattern = /^jane-doe-profile-\d{8}-\d{6}\.txt$/

async function pickMonthYear(
  page: Page,
  fieldLabel: string,
  pickerLabel: string,
  month: string,
  year: string,
) {
  await page.getByLabel(fieldLabel).first().click()
  await page.getByLabel(`${pickerLabel} year`).selectOption(year)
  await page.getByRole('button', { name: `${month} ${year}` }).click()
}

async function pickPresent(page: Page, fieldLabel: string) {
  await page.getByLabel(fieldLabel).first().click()
  await page.getByRole('button', { name: 'Present' }).click()
}

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

test('exports the current profile as an import template', async ({ page }) => {
  await page.goto('/profile')

  await page.getByLabel('Name').fill('Jane Doe')
  await page.getByLabel('Email').fill('jane@example.com')

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export profile' }).click()
  const file = await download

  expect(file.suggestedFilename()).toMatch(profileFileNamePattern)

  const content = await readFile((await file.path())!, 'utf8')
  expect(content).toContain('[PERSONAL]')
  expect(content).toContain('Name: Jane Doe')
  expect(content).toContain('Email: jane@example.com')
})

test('captures project dates and the associated company', async ({ page }) => {
  await page.goto('/profile')

  await page.getByLabel('Name').fill('Jane Doe')
  await page.getByLabel('Email').fill('jane@example.com')

  await page.getByRole('button', { name: 'Add experience' }).click()
  await page.getByLabel('Company').fill('Acme')
  await page.getByLabel('Title').fill('Engineer')

  await page.getByRole('button', { name: 'Add education' }).click()
  await page.getByLabel('School').fill('State University')

  await page.getByRole('button', { name: 'Add project' }).click()
  await page.locator('#project-0-name').fill('Jobriq')
  await page
    .locator('#project-0-description')
    .fill('A resume builder for tracking applications.')
  await page.locator('#project-0-associated').click()
  await expect(
    page.getByRole('option', { name: 'State University' }),
  ).toBeVisible()
  await expect(page.getByRole('option', { name: 'Personal Project' })).toBeVisible()
  await page.getByRole('option', { name: 'Acme' }).click()

  await page.locator('#project-0-start').click()
  await page.getByLabel('Project 1 start date year').selectOption('2022')
  await page.getByRole('button', { name: 'August 2022' }).click()

  await page.locator('#project-0-end').click()
  await page.getByRole('button', { name: 'Present' }).click()

  await expect(
    page.getByRole('link', { name: '1 · Jobriq — Acme' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.reload()
  await expect(page.locator('#project-0-start')).toContainText('Aug 2022')
  await expect(page.locator('#project-0-end')).toContainText('Present')
  await expect(page.locator('#project-0-associated')).toHaveValue('Acme')
  await expect(page.locator('#project-0-description')).toHaveValue(
    'A resume builder for tracking applications.',
  )
})

test('captures certifications and awards in the generated resume', async ({
  page,
}) => {
  await page.goto('/profile')

  await page.getByLabel('Name').fill('Jane Doe')
  await page.getByLabel('Email').fill('jane@example.com')

  await page.getByRole('button', { name: 'Add education' }).click()
  await page.getByLabel('School').fill('State University')

  await page.getByRole('button', { name: 'Add certification' }).click()
  await page.locator('#certification-0-name').fill('AWS Solutions Architect')
  await page
    .locator('#certification-0-issuer')
    .fill('Amazon Web Services')
  await page.keyboard.press('Escape')
  await page.locator('#certification-0-issue').click()
  await page.getByLabel('Certification 1 issue date year').selectOption('2024')
  await page.getByRole('button', { name: 'March 2024' }).click()
  await page.locator('#certification-0-credential-id').fill('ABC-123')
  await page
    .locator('#certification-0-credential-url')
    .fill('https://example.com/verify/ABC-123')

  await page.getByRole('button', { name: 'Add award' }).click()
  await page.locator('#award-0-title').fill('Engineer of the Year')
  await page.locator('#award-0-associated').click()
  await expect(
    page.getByRole('option', { name: 'State University' }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await page.locator('#award-0-associated').fill('Acme')
  await page.keyboard.press('Escape')
  await page.locator('#award-0-issuer').click()
  await expect(
    page.getByRole('option', { name: 'Amazon Web Services' }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await page.locator('#award-0-issuer').fill('IEEE')
  await page.keyboard.press('Escape')
  await page.locator('#award-0-issue').click()
  await page.getByLabel('Award 1 issue date year').selectOption('2023')
  await page.getByRole('button', { name: 'December 2023' }).click()
  await page
    .locator('#award-0-description')
    .fill('Recognized for reliability work.')

  await expect(
    page.getByRole('link', {
      name: '1 · AWS Solutions Architect — Amazon Web Services',
    }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.reload()
  await expect(page.locator('#certification-0-name')).toHaveValue(
    'AWS Solutions Architect',
  )
  await expect(page.locator('#certification-0-issue')).toContainText('Mar 2024')
  await expect(page.locator('#award-0-title')).toHaveValue('Engineer of the Year')
  await expect(page.locator('#award-0-issue')).toContainText('Dec 2023')

  await page.getByRole('button', { name: 'Resume', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Generate resume' }).click()

  await expect(dialog.getByText('Licenses & certifications')).toBeVisible()
  await expect(
    dialog.getByText('AWS Solutions Architect — Amazon Web Services'),
  ).toBeVisible()
  await expect(dialog.getByText('Credential ID: ABC-123')).toBeVisible()
  await expect(dialog.getByText('Honors & awards')).toBeVisible()
  await expect(dialog.getByText('Engineer of the Year — IEEE')).toBeVisible()
  await expect(dialog.getByText('Dec 2023 · Acme')).toBeVisible()
  await expect(dialog.getByText('Recognized for reliability work.')).toBeVisible()

  const markdownDownload = page.waitForEvent('download')
  await dialog.getByRole('button', { name: 'Markdown' }).click()
  expect((await markdownDownload).suggestedFilename()).toMatch(fileNamePattern)
})

test('edits an application and sets its applied date', async ({ page }) => {
  await page.goto('/applications')
  await addApplication(page, 'Globex', 'Senior Engineer')

  await page
    .getByRole('button', { name: 'Edit Senior Engineer at Globex' })
    .click()
  const dialog = page.getByRole('dialog')

  await dialog.getByLabel('Date applied (optional)').click()
  await page.getByLabel('Date applied year').selectOption('2022')
  await page.getByRole('button', { name: 'August 2022' }).click()
  await dialog.getByRole('button', { name: 'Save changes' }).click()

  await expect(dialog).toBeHidden()
  await expect(page.getByText('Applied Aug 2022').last()).toBeVisible()

  await page.reload()
  await expect(page.getByText('Applied Aug 2022').last()).toBeVisible()
})

test('profile, application, generation, and downloads', async ({ page }) => {
  await page.goto('/profile')

  await page.getByLabel('Name').fill('Jane Doe')
  await page.getByLabel('Email').fill('jane@example.com')
  await page.getByLabel('Location').fill('Remote')

  await page.getByRole('button', { name: 'Add experience' }).click()
  await page.getByLabel('Company').fill('Acme')
  await page.getByLabel('Title').fill('Engineer')
  await pickMonthYear(page, 'Start date', 'Experience 1 start date', 'August', '2022')
  await pickPresent(page, 'End date')
  await page
    .getByRole('textbox', { name: 'Experience 1 bullet 1', exact: true })
    .fill('Built a thing')

  await page.getByRole('textbox', { name: 'Skills', exact: true }).fill('C#, React')
  await page.getByRole('textbox', { name: 'Skills', exact: true }).press('Enter')
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

test('compiles skills gained in entries into the overall Skills list', async ({
  page,
}) => {
  await page.goto('/profile')

  await page.getByLabel('Name').fill('Jane Doe')
  await page.getByLabel('Email').fill('jane@example.com')
  await page.getByRole('button', { name: 'Add experience' }).click()
  await page.getByLabel('Company').fill('Acme')
  await page.getByLabel('Title').fill('Engineer')

  const experience = page.getByRole('group', { name: 'Experience 1' })
  const skillsGained = experience.getByRole('textbox', { name: 'Experience 1 skills gained' })
  await skillsGained.fill('Docker, Kubernetes')
  await skillsGained.press('Enter')

  const panel = page.getByRole('region', {
    name: 'Skills gained not in your Skills list',
  })
  await expect(panel).toBeVisible()
  await panel.getByRole('button', { name: 'Add Docker to skills' }).click()
  await panel.getByRole('button', { name: 'Add all missing' }).click()

  await expect(page.getByRole('button', { name: 'Remove skill Docker' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Remove skill Kubernetes' }),
  ).toBeVisible()
  await expect(panel).toBeHidden()

  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.reload()
  await expect(
    experience.getByRole('button', { name: 'Remove Docker from Experience 1' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remove skill Docker' })).toBeVisible()
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
  await pickMonthYear(page, 'Start date', 'Experience 1 start date', 'August', '2022')
  await pickPresent(page, 'End date')
  await page
    .getByRole('textbox', { name: 'Experience 1 bullet 1', exact: true })
    .fill('Built a thing')
  await page.getByRole('textbox', { name: 'Skills', exact: true }).fill('C#, React')
  await page.getByRole('textbox', { name: 'Skills', exact: true }).press('Enter')
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
    page.getByRole('region', { name: 'Profile review controls' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Save profile' }),
  ).toHaveCount(0)

  await page.getByLabel('Name').fill('Jane Doe')
  await expect(
    page.getByRole('region', { name: 'Profile save' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Save profile' }),
  ).toBeVisible()

  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished)),
  )

  const reviewBar = await page
    .getByRole('region', { name: 'Profile review controls' })
    .boundingBox()
  const bar = await page.getByRole('region', { name: 'Profile save' }).boundingBox()
  expect(reviewBar).not.toBeNull()
  expect(bar).not.toBeNull()
  expect(reviewBar!.y).toBeGreaterThanOrEqual(0)
  expect(reviewBar!.y + reviewBar!.height).toBeLessThanOrEqual(bar!.y + 1)
  expect(bar!.y).toBeGreaterThanOrEqual(0)
  expect(bar!.y + bar!.height).toBeLessThanOrEqual(812)

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  const scrolledReviewBar = await page
    .getByRole('region', { name: 'Profile review controls' })
    .boundingBox()
  const scrolledBar = await page
    .getByRole('region', { name: 'Profile save' })
    .boundingBox()
  expect(scrolledReviewBar).not.toBeNull()
  expect(scrolledBar).not.toBeNull()
  expect(scrolledReviewBar!.y + scrolledReviewBar!.height).toBeLessThanOrEqual(
    scrolledBar!.y + 1,
  )
  await page.evaluate(() => window.scrollTo(0, 0))

  const headerOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(headerOverflow).toBe(0)

  await page.getByRole('button', { name: 'Add certification' }).click()
  await page.getByRole('button', { name: 'Add award' }).click()

  const entryOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(entryOverflow).toBe(0)

  await page.getByRole('button', { name: 'Review profile' }).click()
  const reviewDialog = page.getByRole('dialog')
  await expect(reviewDialog).toBeVisible()
  const reviewBox = await reviewDialog.boundingBox()
  expect(reviewBox).not.toBeNull()
  expect(reviewBox!.y).toBeGreaterThanOrEqual(0)
  const reviewOverflow = await page.evaluate(() => {
    const content = document.querySelector('[role="dialog"]')
    return content ? content.scrollWidth - content.clientWidth : -1
  })
  expect(reviewOverflow).toBe(0)

  await page.getByRole('button', { name: 'Close' }).click()
  await expect(reviewDialog).toHaveCount(0)

  await page.getByRole('button', { name: 'Resume', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  const dialogOverflow = await page.evaluate(() => {
    const content = document.querySelector('[role="dialog"]')
    return content ? content.scrollWidth - content.clientWidth : -1
  })
  expect(dialogOverflow).toBe(0)
})

test('keeps the last project field above the save bar', async ({ page }) => {
  await page.goto('/profile')

  await page.getByLabel('Name').fill('Jane Doe')
  await page.getByRole('button', { name: 'Add project' }).click()
  await page.locator('#project-0-name').fill('Jobriq')
  await page
    .getByRole('textbox', { name: 'Project 1 bullet 1', exact: true })
    .fill('Built a resume builder')

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto'
    window.scrollTo(0, document.documentElement.scrollHeight)
  })

  const bar = await page.getByRole('region', { name: 'Profile save' }).boundingBox()
  const bullet = await page
    .getByRole('textbox', { name: 'Project 1 bullet 1', exact: true })
    .boundingBox()

  expect(bar).not.toBeNull()
  expect(bullet).not.toBeNull()
  expect(bullet!.y + bullet!.height).toBeLessThanOrEqual(bar!.y)
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

  const reviewDialog = page.getByRole('dialog')
  await expect(reviewDialog).toBeVisible()
  await expect(page.getByText('Deterministic reviewed summary.')).toBeVisible()
  await expect(page.getByText('Reviewed: Built a thing')).toBeVisible()
  await expect(page.getByText('Group related skills')).toBeVisible()

  await page
    .getByRole('button', {
      name: 'Apply suggestion: Add a professional summary',
    })
    .click()

  await page.getByRole('button', { name: 'Close' }).click()
  await expect(reviewDialog).toHaveCount(0)

  const summary = page.getByRole('textbox', { name: 'Summary' })
  await expect(summary).toHaveValue('Deterministic reviewed summary.')
  await expect(page.getByRole('button', { name: 'Save profile' })).toBeEnabled()

  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Applications' }).click()
  await page.getByRole('link', { name: 'Profile' }).click()
  await page.getByRole('button', { name: /Review suggestions/ }).click()
  await expect(page.getByText('Add a professional summary')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Summary' })).toHaveValue(
    'Deterministic reviewed summary.',
  )
  await expect(page.getByText('Add a professional summary')).toHaveCount(0)
})

test('opens the review dialog from a deep link', async ({ page }) => {
  await page.goto('/profile#profile-review')

  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(
    page.getByText('No review yet. Run Review profile to get suggestions.'),
  ).toBeVisible()
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
  await expect(page.getByRole('textbox', { name: 'Skills', exact: true })).toHaveValue('')

  await page.getByRole('link', { name: 'Applications' }).click()
  await expect(page.getByText('No applications yet')).toBeVisible()
  await expect(page.getByText('Legacy Corp')).toHaveCount(0)
})
