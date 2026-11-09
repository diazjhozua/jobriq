import { expect, type Locator, type Page } from '@playwright/test'
import { pickMonthYear } from '../../support/month-year'

export class EditApplicationDialog {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Edit application' })
  }

  async setAppliedDate(month: string, year: string): Promise<void> {
    await pickMonthYear(
      this.page,
      this.dialog().getByLabel('Date applied (optional)'),
      'Date applied',
      month,
      year,
    )
  }

  async saveChanges(): Promise<void> {
    await this.dialog().getByRole('button', { name: 'Save changes' }).click()
  }

  async expectHidden(): Promise<void> {
    await expect(this.dialog()).toBeHidden()
  }
}
