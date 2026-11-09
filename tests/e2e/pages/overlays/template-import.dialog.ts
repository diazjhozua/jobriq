import { expect, type Locator, type Page } from '@playwright/test'

export class TemplateImportDialog {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Import resume template' })
  }

  async importTemplate(text: string): Promise<void> {
    await this.dialog().getByLabel('Template text').fill(text)
    await this.dialog().getByRole('button', { name: 'Import profile' }).click()
  }

  async expectHidden(): Promise<void> {
    await expect(this.dialog()).toBeHidden()
  }
}
