import { expect, type Locator, type Page } from '@playwright/test'

export class ProfileReviewSection {
  constructor(private readonly page: Page) {}

  controls(): Locator {
    return this.page.getByRole('region', { name: 'Profile review controls' })
  }

  async open(): Promise<void> {
    await this.page.getByRole('button', { name: 'Review profile' }).click()
  }

  async openSuggestions(): Promise<void> {
    await this.page.getByRole('button', { name: /Review suggestions/ }).click()
  }

  async expectControlsVisible(): Promise<void> {
    await expect(this.controls()).toBeVisible()
  }

  async expectSuggestion(title: string): Promise<void> {
    await expect(this.page.getByText(title)).toBeVisible()
  }

  async expectNoSuggestion(title: string): Promise<void> {
    await expect(this.page.getByText(title)).toHaveCount(0)
  }
}
