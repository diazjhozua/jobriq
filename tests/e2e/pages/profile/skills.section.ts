import { expect, type Locator, type Page } from '@playwright/test'

export class ProfileSkillsSection {
  constructor(private readonly page: Page) {}

  input(): Locator {
    return this.page.getByRole('textbox', { name: 'Skills', exact: true })
  }

  suggestions(): Locator {
    return this.page.getByRole('region', {
      name: 'Skills gained not in your Skills list',
    })
  }

  tag(name: string): Locator {
    return this.page.getByRole('button', { name: `Remove skill ${name}` })
  }

  entryTag(section: string, index: number, name: string): Locator {
    return this.page
      .getByRole('group', { name: `${section} ${index}` })
      .getByRole('button', { name: `Remove ${name} from ${section} ${index}` })
  }

  async add(tags: string[]): Promise<void> {
    await this.input().fill(tags.join(', '))
    await this.input().press('Enter')
  }

  async expectTag(name: string): Promise<void> {
    await expect(this.tag(name)).toBeVisible()
  }

  async expectEntryTag(
    section: string,
    index: number,
    name: string,
  ): Promise<void> {
    await expect(this.entryTag(section, index, name)).toBeVisible()
  }

  async expectSuggestionsVisible(): Promise<void> {
    await expect(this.suggestions()).toBeVisible()
  }

  async expectSuggestionsHidden(): Promise<void> {
    await expect(this.suggestions()).toBeHidden()
  }

  async addSuggested(name: string): Promise<void> {
    await this.suggestions()
      .getByRole('button', { name: `Add ${name} to skills` })
      .click()
  }

  async addAllMissing(): Promise<void> {
    await this.suggestions().getByRole('button', { name: 'Add all missing' }).click()
  }
}
