import { expect, type Locator, type Page } from '@playwright/test'

export class ConfirmDialog {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole('alertdialog')
  }

  async confirm(label = 'Delete'): Promise<void> {
    await this.dialog().getByRole('button', { name: label }).click()
  }

  async expectHidden(): Promise<void> {
    await expect(this.dialog()).toBeHidden()
  }
}
