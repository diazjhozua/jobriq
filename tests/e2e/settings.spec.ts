import { expect, test, type Page } from '@playwright/test'

function styleItem(page: Page, name: string) {
  return page.locator('li', {
    has: page.getByRole('heading', { name, exact: true }),
  })
}

function themeItem(page: Page, name: string) {
  return page.locator('li', {
    has: page.getByRole('heading', { name, exact: true }),
  })
}

async function createTheme(page: Page, name: string) {
  await page.getByRole('button', { name: 'New theme' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Name', { exact: true }).fill(name)
  await dialog.getByRole('button', { name: 'Create theme' }).click()

  await expect(dialog).toBeHidden()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
}

async function createStyle(page: Page, name: string, instructions: string) {
  await page.getByRole('button', { name: 'New prompt style' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Name').fill(name)
  await dialog.getByLabel('Instructions').fill(instructions)
  await dialog.getByRole('button', { name: 'Create prompt style' }).click()

  await expect(dialog).toBeHidden()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
}

test('creates a prompt style and uses it for generation', async ({ page }) => {
  await page.goto('/settings')

  await expect(
    page.getByRole('region', { name: 'Built-in baseline' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'No saved styles yet' }),
  ).toBeVisible()

  await createStyle(page, 'Warm voice', 'Prefer warm, plain sentences.')

  const warm = styleItem(page, 'Warm voice')
  await expect(warm.getByText('Active', { exact: true })).toBeVisible()
  await expect(warm.getByText('Prefer warm, plain sentences.')).toBeVisible()

  await page.reload()
  await expect(styleItem(page, 'Warm voice').getByText('Active', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Profile' }).click()
  await page.getByLabel('Name').fill('Jane Doe')
  await page.getByLabel('Email').fill('jane@example.com')
  await page.getByRole('button', { name: 'Add experience' }).click()
  await page.getByLabel('Company').fill('Acme')
  await page.getByLabel('Title').fill('Engineer')
  await page
    .getByRole('textbox', { name: 'Experience 1 bullet 1', exact: true })
    .fill('Built a thing')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Resume', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Generate resume' }).click()

  await expect(
    dialog.getByText('Deterministic professional summary. [style: Warm voice]'),
  ).toBeVisible()
  await expect(
    dialog.getByText('Enhanced: Built a thing [style: Warm voice]'),
  ).toBeVisible()
})

test('switches the active style and falls back to the baseline on delete', async ({
  page,
}) => {
  await page.goto('/settings')

  await createStyle(page, 'Warm voice', 'Prefer warm, plain sentences.')
  await createStyle(page, 'Terse voice', 'Cut every extra word.')

  await expect(styleItem(page, 'Warm voice').getByText('Active', { exact: true })).toBeVisible()

  const terse = styleItem(page, 'Terse voice')
  await terse.getByRole('button', { name: 'Set active Terse voice' }).click()
  await expect(terse.getByText('Active', { exact: true })).toBeVisible()
  await expect(styleItem(page, 'Warm voice').getByText('Active', { exact: true })).toHaveCount(0)

  await page.reload()
  await expect(styleItem(page, 'Terse voice').getByText('Active', { exact: true })).toBeVisible()

  await styleItem(page, 'Terse voice')
    .getByRole('button', { name: 'Delete Terse voice' })
    .click()
  const confirm = page.getByRole('alertdialog')
  await confirm.getByRole('button', { name: 'Delete' }).click()

  await expect(confirm).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Terse voice' })).toHaveCount(0)
  await expect(
    page
      .getByRole('region', { name: 'Built-in baseline' })
      .getByText('Active', { exact: true }),
  ).toBeVisible()
  await expect(
    styleItem(page, 'Warm voice').getByRole('button', {
      name: 'Set active Warm voice',
    }),
  ).toBeVisible()
})

test('creates a resume theme and keeps the active design across reloads', async ({
  page,
}) => {
  await page.goto('/settings')

  const builtIn = page.getByRole('region', { name: 'Built-in themes' })
  await expect(builtIn).toBeVisible()
  for (const name of ['Classic', 'Modern', 'Compact', 'Editorial', 'Monochrome']) {
    await expect(
      builtIn.getByRole('heading', { name, exact: true }),
    ).toBeVisible()
  }

  const classic = themeItem(page, 'Classic')
  await expect(classic.getByText('Active', { exact: true })).toBeVisible()
  await expect(classic.getByText('Read-only', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'No saved themes yet' }),
  ).toBeVisible()

  await createTheme(page, 'Warm serif')

  const saved = page.getByRole('region', { name: 'Your themes' })
  await expect(
    saved.getByRole('heading', { name: 'Warm serif', exact: true }),
  ).toBeVisible()
  await expect(themeItem(page, 'Warm serif').getByText('Active', { exact: true })).toHaveCount(0)

  await themeItem(page, 'Warm serif')
    .getByRole('button', { name: 'Set active Warm serif' })
    .click()
  await expect(
    themeItem(page, 'Warm serif').getByText('Active', { exact: true }),
  ).toBeVisible()
  await expect(classic.getByText('Active', { exact: true })).toHaveCount(0)

  await page.reload()
  await expect(
    themeItem(page, 'Warm serif').getByText('Active', { exact: true }),
  ).toBeVisible()
  await expect(
    themeItem(page, 'Classic').getByText('Active', { exact: true }),
  ).toHaveCount(0)
})

test('falls back to Classic when the active custom theme is deleted', async ({
  page,
}) => {
  await page.goto('/settings')

  await createTheme(page, 'Warm serif')
  await themeItem(page, 'Warm serif')
    .getByRole('button', { name: 'Set active Warm serif' })
    .click()
  await expect(
    themeItem(page, 'Warm serif').getByText('Active', { exact: true }),
  ).toBeVisible()

  await themeItem(page, 'Warm serif')
    .getByRole('button', { name: 'Delete Warm serif' })
    .click()
  const confirm = page.getByRole('alertdialog')
  await confirm.getByRole('button', { name: 'Delete' }).click()

  await expect(confirm).toBeHidden()
  await expect(
    page.getByRole('heading', { name: 'Warm serif', exact: true }),
  ).toHaveCount(0)
  await expect(
    themeItem(page, 'Classic').getByText('Active', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'No saved themes yet' }),
  ).toBeVisible()
})
