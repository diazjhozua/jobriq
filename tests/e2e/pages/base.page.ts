import { expect, type Page } from '@playwright/test'
import { documentOverflow } from '../support/layout'

export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path)
  }

  async expectHeading(name: string | RegExp): Promise<void> {
    await expect(
      this.page.getByRole('heading', { name, exact: true }),
    ).toBeVisible()
  }

  async expectNoDocumentOverflow(): Promise<void> {
    expect(await documentOverflow(this.page)).toBe(0)
  }
}
