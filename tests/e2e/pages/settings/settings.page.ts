import { type Page } from '@playwright/test'
import { BasePage } from '../base.page'
import { PrivacySection } from './privacy.section'
import { PromptStylesSection } from './prompt-styles.section'
import { ThemesSection } from './themes.section'

export class SettingsPage extends BasePage {
  readonly promptStyles: PromptStylesSection
  readonly themes: ThemesSection
  readonly privacy: PrivacySection

  constructor(page: Page) {
    super(page)
    this.promptStyles = new PromptStylesSection(page)
    this.themes = new ThemesSection(page)
    this.privacy = new PrivacySection(page)
  }

  async open(): Promise<void> {
    await this.goto('/settings')
    await this.expectHeading('Settings')
  }
}
