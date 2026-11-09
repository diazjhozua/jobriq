import { expect, type Locator, type Page } from '@playwright/test'

export class PromptStyleDialog {
  constructor(
    private readonly page: Page,
    private readonly mode: 'create' | 'edit' = 'create',
  ) {}

  dialog(): Locator {
    return this.page.getByRole('dialog', {
      name: this.mode === 'create' ? 'New prompt style' : 'Edit prompt style',
    })
  }

  async fill(name: string, instructions: string): Promise<void> {
    await this.dialog().getByLabel('Name').fill(name)
    await this.dialog().getByLabel('Instructions').fill(instructions)
  }

  async submit(): Promise<void> {
    await this.dialog()
      .getByRole('button', {
        name: this.mode === 'create' ? 'Create prompt style' : 'Save changes',
      })
      .click()
  }

  async create(name: string, instructions: string): Promise<void> {
    await this.fill(name, instructions)
    await this.submit()
  }

  async expectHidden(): Promise<void> {
    await expect(this.dialog()).toBeHidden()
  }
}
