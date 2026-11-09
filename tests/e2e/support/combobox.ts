import { expect, type Locator, type Page } from '@playwright/test'

/** Combobox options portal to document.body, so they are resolved from the page. */
export async function expectComboboxOption(
  page: Page,
  option: string,
): Promise<void> {
  await expect(page.getByRole('option', { name: option })).toBeVisible()
}

/** Types a custom value and commits it by closing the suggestion popover. */
export async function typeComboboxValue(
  page: Page,
  trigger: Locator,
  value: string,
): Promise<void> {
  await trigger.click()
  await trigger.fill(value)
  await page.keyboard.press('Escape')
}
