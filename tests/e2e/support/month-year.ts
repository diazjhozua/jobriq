import type { Locator, Page } from '@playwright/test'

/**
 * The MonthYearPicker popover portals to document.body, so the year select and
 * month button are resolved from the page, not from the field's container.
 */
export async function pickMonthYear(
  page: Page,
  trigger: Locator,
  pickerLabel: string,
  month: string,
  year: string,
): Promise<void> {
  await trigger.click()
  await page.getByLabel(`${pickerLabel} year`).selectOption(year)
  await page.getByRole('button', { name: `${month} ${year}` }).click()
}

export async function pickPresent(page: Page, trigger: Locator): Promise<void> {
  await trigger.click()
  await page.getByRole('button', { name: 'Present' }).click()
}
