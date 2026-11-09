import { expect, type Locator, type Page } from '@playwright/test'
import { boundingBox } from '../../support/layout'

export class ResumeThemeDialog {
  constructor(
    private readonly page: Page,
    private readonly mode: 'create' | 'edit' = 'create',
  ) {}

  dialog(): Locator {
    return this.page.getByRole('dialog', {
      name: this.mode === 'create' ? 'New resume theme' : 'Edit resume theme',
    })
  }

  nameField(): Locator {
    return this.dialog().getByLabel('Name', { exact: true })
  }

  preview(): Locator {
    return this.dialog().locator('[data-theme-page]')
  }

  async create(name: string): Promise<void> {
    await this.nameField().fill(name)
    await this.dialog().getByRole('button', { name: 'Create theme' }).click()
  }

  async expectHidden(): Promise<void> {
    await expect(this.dialog()).toBeHidden()
  }

  async expectPreviewVisible(): Promise<void> {
    await expect(this.preview()).toBeVisible()
  }

  async expectPreviewRightOfNameField(): Promise<void> {
    const field = await boundingBox(this.nameField())
    const preview = await boundingBox(this.preview())
    expect(preview.x).toBeGreaterThan(field.x + field.width)
  }
}
