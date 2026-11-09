import { expect, type Locator, type Page } from '@playwright/test'
import {
  expectHeadingAbsent,
  expectItemActive,
  expectItemNotActive,
  settingsItem,
} from '../../support/settings-list'
import { ConfirmDialog } from '../overlays/confirm.dialog'
import { ResumeThemeDialog } from '../overlays/resume-theme.dialog'

export class ThemesSection {
  constructor(private readonly page: Page) {}

  builtIn(): Locator {
    return this.page.getByRole('region', { name: 'Built-in themes' })
  }

  saved(): Locator {
    return this.page.getByRole('region', { name: 'Your themes' })
  }

  preview(): Locator {
    return this.page.getByRole('region', { name: 'Theme preview' })
  }

  item(name: string): Locator {
    return settingsItem(this.page, name)
  }

  async openNewTheme(): Promise<ResumeThemeDialog> {
    await this.page.getByRole('button', { name: 'New theme' }).click()
    const dialog = new ResumeThemeDialog(this.page)
    await expect(dialog.dialog()).toBeVisible()
    return dialog
  }

  async create(name: string): Promise<void> {
    const dialog = await this.openNewTheme()
    await dialog.create(name)
    await dialog.expectHidden()
  }

  async setActive(name: string): Promise<void> {
    await this.item(name)
      .getByRole('button', { name: `Set active ${name}` })
      .click()
  }

  async delete(name: string): Promise<ConfirmDialog> {
    await this.item(name)
      .getByRole('button', { name: `Delete ${name}` })
      .click()
    return new ConfirmDialog(this.page)
  }

  async previewTheme(name: string): Promise<void> {
    await this.page.getByRole('button', { name: `Preview ${name}` }).click()
  }

  async expectPreviewing(name: string): Promise<void> {
    await expect(this.preview().getByText(name, { exact: true })).toBeVisible()
  }

  async expectPreviewPressed(name: string): Promise<void> {
    await expect(
      this.page.getByRole('button', { name: `Preview ${name}` }),
    ).toHaveAttribute('aria-pressed', 'true')
  }

  async expectActive(name: string): Promise<void> {
    await expectItemActive(this.item(name))
  }

  async expectNotActive(name: string): Promise<void> {
    await expectItemNotActive(this.item(name))
  }

  async expectReadOnly(name: string): Promise<void> {
    await expect(
      this.item(name).getByText('Read-only', { exact: true }),
    ).toBeVisible()
  }

  async expectBuiltIns(names: string[]): Promise<void> {
    for (const name of names) {
      await expect(
        this.builtIn().getByRole('heading', { name, exact: true }),
      ).toBeVisible()
    }
  }

  async expectSavedTheme(name: string): Promise<void> {
    await expect(
      this.saved().getByRole('heading', { name, exact: true }),
    ).toBeVisible()
  }

  async expectNoSaved(): Promise<void> {
    await expect(
      this.page.getByRole('heading', { name: 'No saved themes yet' }),
    ).toBeVisible()
  }

  async expectAbsent(name: string): Promise<void> {
    await expectHeadingAbsent(this.page, name)
  }
}
