import { BasePage } from './base.page'

export class AppShellPage extends BasePage {
  async openProfile(): Promise<void> {
    await this.page.getByRole('link', { name: 'Profile' }).click()
  }

  async openApplications(): Promise<void> {
    await this.page.getByRole('link', { name: 'Applications' }).click()
  }

  async openSettings(): Promise<void> {
    await this.page.getByRole('link', { name: 'Settings' }).click()
  }
}
