import { expect, type Locator, type Page } from '@playwright/test'
import { boundingBox, dialogOverflow } from '../../support/layout'

export class ProfileReviewDialog {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Profile review' })
  }

  async expectVisible(): Promise<void> {
    await expect(this.dialog()).toBeVisible()
  }

  async expectText(text: string): Promise<void> {
    await expect(this.dialog().getByText(text)).toBeVisible()
  }

  async expectEmpty(): Promise<void> {
    await expect(
      this.dialog().getByText('No review yet. Run Review profile to get suggestions.'),
    ).toBeVisible()
  }

  async applySuggestion(title: string): Promise<void> {
    await this.dialog()
      .getByRole('button', { name: `Apply suggestion: ${title}` })
      .click()
  }

  async close(): Promise<void> {
    await this.dialog().getByRole('button', { name: 'Close' }).click()
  }

  async expectHidden(): Promise<void> {
    await expect(this.dialog()).toHaveCount(0)
  }

  async expectInViewport(): Promise<void> {
    const box = await boundingBox(this.dialog())
    expect(box.y).toBeGreaterThanOrEqual(0)
  }

  async expectNoHorizontalOverflow(): Promise<void> {
    expect(await dialogOverflow(this.page)).toBe(0)
  }
}
