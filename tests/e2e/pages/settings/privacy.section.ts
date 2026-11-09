import { expect, type Locator, type Page } from '@playwright/test'

export class PrivacySection {
  constructor(private readonly page: Page) {}

  toggle(): Locator {
    return this.page.getByRole('switch', {
      name: 'Redact personal details before AI requests',
    })
  }

  async expectEnabled(): Promise<void> {
    await expect(this.toggle()).toBeChecked()
  }

  async expectDisabled(): Promise<void> {
    await expect(this.toggle()).not.toBeChecked()
  }

  async set(enabled: boolean): Promise<void> {
    const saved = this.page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/pii-masking') &&
        response.request().method() === 'PUT',
    )

    if (enabled) {
      await this.toggle().check()
    } else {
      await this.toggle().uncheck()
    }

    await saved
  }
}
