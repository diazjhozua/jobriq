import { expect, type Locator, type Page } from '@playwright/test'

export class ApplicationRow {
  readonly target: string

  constructor(
    private readonly page: Page,
    readonly company: string,
    readonly role: string,
  ) {
    this.target = `${role} at ${company}`
  }

  status(): Locator {
    return this.page.getByLabel(`Status for ${this.target}`)
  }

  descriptionToggle(): Locator {
    return this.page.getByRole('button', {
      name: `description for ${this.target}`,
    })
  }

  viewDescriptionButton(): Locator {
    return this.page.getByRole('button', {
      name: `View description for ${this.target}`,
      exact: true,
    })
  }

  hideDescriptionButton(): Locator {
    return this.page.getByRole('button', {
      name: `Hide description for ${this.target}`,
      exact: true,
    })
  }

  generateResumeButton(): Locator {
    return this.page.getByRole('button', {
      name: `Generate resume for ${this.target}`,
      exact: true,
    })
  }

  viewResumeButton(): Locator {
    return this.page.getByRole('button', {
      name: `View resume for ${this.target}`,
      exact: true,
    })
  }

  writeCoverLetterButton(): Locator {
    return this.page.getByRole('button', {
      name: `Write cover letter for ${this.target}`,
      exact: true,
    })
  }

  viewCoverLetterButton(): Locator {
    return this.page.getByRole('button', {
      name: `View cover letter for ${this.target}`,
      exact: true,
    })
  }

  editButton(): Locator {
    return this.page.getByRole('button', { name: `Edit ${this.target}` })
  }

  deleteButton(): Locator {
    return this.page.getByRole('button', { name: `Delete ${this.target}` })
  }

  async expectVisible(): Promise<void> {
    await expect(this.status()).toBeVisible()
    await expect(this.viewDescriptionButton()).toBeVisible()
    await expect(this.generateResumeButton()).toBeVisible()
    await expect(this.writeCoverLetterButton()).toBeVisible()
    await expect(this.deleteButton()).toBeVisible()
  }

  async expectStatus(status: string): Promise<void> {
    await expect(this.status()).toHaveValue(status)
  }

  async setStatus(status: string): Promise<void> {
    const saved = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        response.url().includes('/status') &&
        response.ok(),
    )
    await this.status().selectOption(status)
    await saved
  }
}
