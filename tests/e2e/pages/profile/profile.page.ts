import { expect, type Download, type Locator, type Page } from '@playwright/test'
import { captureDownload } from '../../support/downloads'
import { boundingBox } from '../../support/layout'
import { BasePage } from '../base.page'
import { ProfileReviewDialog } from '../overlays/profile-review.dialog'
import { ResumeDialog } from '../overlays/resume.dialog'
import { TemplateImportDialog } from '../overlays/template-import.dialog'
import { ProfileEntriesSection } from './entries.section'
import { ProfilePersonalSection } from './personal.section'
import { ProfileReviewSection } from './review.section'
import { ProfileSkillsSection } from './skills.section'

export class ProfilePage extends BasePage {
  readonly personal: ProfilePersonalSection
  readonly entries: ProfileEntriesSection
  readonly skills: ProfileSkillsSection
  readonly review: ProfileReviewSection

  constructor(page: Page) {
    super(page)
    this.personal = new ProfilePersonalSection(page)
    this.entries = new ProfileEntriesSection(page)
    this.skills = new ProfileSkillsSection(page)
    this.review = new ProfileReviewSection(page)
  }

  async open(): Promise<void> {
    await this.goto('/profile')
    await this.expectHeading('Profile')
  }

  async openReviewDeepLink(): Promise<void> {
    await this.goto('/profile#profile-review')
  }

  openTemplateImport(): TemplateImportDialog {
    return new TemplateImportDialog(this.page)
  }

  async importTemplate(text: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Import template' }).click()
    const dialog = this.openTemplateImport()
    await dialog.importTemplate(text)
    await dialog.expectHidden()
  }

  exportProfile(): Promise<Download> {
    return captureDownload(this.page, () =>
      this.page.getByRole('button', { name: 'Export profile' }).click(),
    )
  }

  reviewDialog(): ProfileReviewDialog {
    return new ProfileReviewDialog(this.page)
  }

  async openReviewDialog(): Promise<ProfileReviewDialog> {
    await this.review.open()
    const dialog = this.reviewDialog()
    await dialog.expectVisible()
    return dialog
  }

  async openResume(): Promise<ResumeDialog> {
    await this.resumeButton().click()
    const dialog = new ResumeDialog(this.page, 'Resume')
    await dialog.expectVisible()
    return dialog
  }

  async save(): Promise<void> {
    await this.saveButton().click()
  }

  async expectSaved(): Promise<void> {
    await expect(this.page.getByText('Saved', { exact: true })).toBeVisible()
  }

  resumeButton(): Locator {
    return this.page.getByRole('button', { name: 'Resume', exact: true })
  }

  saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save profile' })
  }

  saveBar(): Locator {
    return this.page.getByRole('region', { name: 'Profile save' })
  }

  async expectSaveButtonHidden(): Promise<void> {
    await expect(this.saveButton()).toHaveCount(0)
  }

  async expectSaveButtonVisible(): Promise<void> {
    await expect(this.saveButton()).toBeVisible()
  }

  async expectSaveBarVisible(): Promise<void> {
    await expect(this.saveBar()).toBeVisible()
  }

  async expectReviewLauncherAboveSaveBar(): Promise<void> {
    const review = await boundingBox(this.review.controls())
    const bar = await boundingBox(this.saveBar())
    expect(review.y).toBeGreaterThanOrEqual(0)
    expect(review.y + review.height).toBeLessThanOrEqual(bar.y + 1)
    expect(bar.y).toBeGreaterThanOrEqual(0)
  }

  async expectSaveBarWithinViewport(height: number): Promise<void> {
    const bar = await boundingBox(this.saveBar())
    expect(bar.y + bar.height).toBeLessThanOrEqual(height)
  }

  async expectLastProjectBulletAboveSaveBar(
    index: number,
    bullet: number,
  ): Promise<void> {
    const bar = await boundingBox(this.saveBar())
    const field = await boundingBox(this.entries.bullet('Project', index, bullet))
    expect(field.y + field.height).toBeLessThanOrEqual(bar.y)
  }

  async expectSummaryValue(value: string): Promise<void> {
    await expect(this.personal.summary()).toHaveValue(value)
  }

  async expectSkillInputValue(value: string): Promise<void> {
    await expect(this.skills.input()).toHaveValue(value)
  }
}
