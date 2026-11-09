import { expect, type Download, type Locator, type Page } from '@playwright/test'
import { captureDownload } from '../../support/downloads'
import { dialogOverflow } from '../../support/layout'

export class ResumeDialog {
  constructor(
    private readonly page: Page,
    private readonly title: string | RegExp,
  ) {}

  dialog(): Locator {
    return this.page.getByRole('dialog', { name: this.title, exact: true })
  }

  async expectVisible(): Promise<void> {
    await expect(this.dialog()).toBeVisible()
  }

  async generate(): Promise<void> {
    await this.dialog().getByRole('button', { name: 'Generate resume' }).click()
  }

  async expectText(text: string): Promise<void> {
    await expect(this.dialog().getByText(text)).toBeVisible()
  }

  async expectTextCount(text: string, count: number): Promise<void> {
    await expect(this.dialog().getByText(text)).toHaveCount(count)
  }

  downloadMarkdown(): Promise<Download> {
    return captureDownload(this.page, () =>
      this.dialog().getByRole('button', { name: 'Download Markdown' }).click(),
    )
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

  async expectNoHorizontalOverflow(): Promise<void> {
    expect(await dialogOverflow(this.page)).toBe(0)
  }
}
