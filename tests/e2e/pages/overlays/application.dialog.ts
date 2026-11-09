import { expect, type Locator, type Page } from '@playwright/test'

export type ApplicationValues = {
  company: string
  role: string
  jobDescription: string
}

export class ApplicationDialog {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Add application' })
  }

  async fill(values: ApplicationValues): Promise<void> {
    await this.dialog().getByLabel('Company').fill(values.company)
    await this.dialog().getByLabel('Role').fill(values.role)
    await this.dialog()
      .getByLabel('Job description')
      .fill(values.jobDescription)
  }

  async submit(): Promise<void> {
    await this.dialog().getByRole('button', { name: 'Add application' }).click()
  }

  async expectHidden(): Promise<void> {
    await expect(this.dialog()).toBeHidden()
  }
}
