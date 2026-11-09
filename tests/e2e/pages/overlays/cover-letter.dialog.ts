import { expect, type Download, type Locator, type Page } from '@playwright/test'
import { captureDownload } from '../../support/downloads'

export class CoverLetterDialog {
  constructor(
    private readonly page: Page,
    private readonly title: string | RegExp,
  ) {}

  dialog(): Locator {
    return this.page.getByRole('dialog', { name: this.title, exact: true })
  }

  async write(): Promise<void> {
    await this.dialog().getByRole('button', { name: 'Write cover letter' }).click()
  }

  async regenerate(): Promise<void> {
    await this.dialog().getByRole('button', { name: 'Regenerate' }).click()
  }

  async expectText(text: string | RegExp): Promise<void> {
    await expect(this.dialog().getByText(text)).toBeVisible()
  }

  downloadDocx(): Promise<Download> {
    return captureDownload(this.page, () =>
      this.dialog().getByRole('button', { name: 'Download DOCX' }).click(),
    )
  }

  async close(): Promise<void> {
    await this.dialog().getByRole('button', { name: 'Close' }).click()
  }

  async expectHidden(): Promise<void> {
    await expect(this.dialog()).toBeHidden()
  }
}
