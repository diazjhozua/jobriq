import { expect, type Locator, type Page } from '@playwright/test'
import {
  expectHeadingAbsent,
  expectItemActive,
  expectItemNotActive,
  settingsItem,
} from '../../support/settings-list'
import { ConfirmDialog } from '../overlays/confirm.dialog'
import { PromptStyleDialog } from '../overlays/prompt-style.dialog'

export class PromptStylesSection {
  constructor(private readonly page: Page) {}

  baseline(): Locator {
    return this.page.getByRole('region', { name: 'Built-in baseline' })
  }

  item(name: string): Locator {
    return settingsItem(this.page, name)
  }

  async create(name: string, instructions: string): Promise<void> {
    await this.page.getByRole('button', { name: 'New prompt style' }).click()
    const dialog = new PromptStyleDialog(this.page)
    await dialog.create(name, instructions)
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

  async expectActive(name: string): Promise<void> {
    await expectItemActive(this.item(name))
  }

  async expectNotActive(name: string): Promise<void> {
    await expectItemNotActive(this.item(name))
  }

  async expectBaselineActive(): Promise<void> {
    await expect(
      this.baseline().getByText('Active', { exact: true }),
    ).toBeVisible()
  }

  async expectBaselineVisible(): Promise<void> {
    await expect(this.baseline()).toBeVisible()
  }

  async expectNoSaved(): Promise<void> {
    await expect(
      this.page.getByRole('heading', { name: 'No saved styles yet' }),
    ).toBeVisible()
  }

  async expectAbsent(name: string): Promise<void> {
    await expectHeadingAbsent(this.page, name)
  }

  async expectCanActivate(name: string): Promise<void> {
    await expect(
      this.item(name).getByRole('button', { name: `Set active ${name}` }),
    ).toBeVisible()
  }

  async expectInstructions(name: string, instructions: string): Promise<void> {
    await expect(this.item(name).getByText(instructions)).toBeVisible()
  }
}
