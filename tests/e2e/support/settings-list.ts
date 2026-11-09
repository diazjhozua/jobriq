import { expect, type Locator, type Page } from '@playwright/test'

/** Settings lists render each saved style or theme as an `li` with a heading. */
export function settingsItem(page: Page, name: string): Locator {
  return page.locator('li', {
    has: page.getByRole('heading', { name, exact: true }),
  })
}

export async function expectItemActive(item: Locator): Promise<void> {
  await expect(item.getByText('Active', { exact: true })).toBeVisible()
}

export async function expectItemNotActive(item: Locator): Promise<void> {
  await expect(item.getByText('Active', { exact: true })).toHaveCount(0)
}

export async function expectHeadingAbsent(
  page: Page,
  name: string,
): Promise<void> {
  await expect(
    page.getByRole('heading', { name, exact: true }),
  ).toHaveCount(0)
}
