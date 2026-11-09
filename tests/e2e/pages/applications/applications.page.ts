import { expect, type Locator, type Page } from '@playwright/test'
import { BasePage } from '../base.page'
import { ApplicationDialog } from '../overlays/application.dialog'
import { ConfirmDialog } from '../overlays/confirm.dialog'
import { CoverLetterDialog } from '../overlays/cover-letter.dialog'
import { EditApplicationDialog } from '../overlays/edit-application.dialog'
import { ResumeDialog } from '../overlays/resume.dialog'
import { ApplicationRow } from './application-row'

export class ApplicationsPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async open(): Promise<void> {
    await this.goto('/applications')
    await this.expectHeading('Applications')
  }

  addButton(): Locator {
    return this.page.getByRole('button', { name: 'Add application' })
  }

  addedColumn(): Locator {
    return this.page.locator('thead th', { hasText: 'Added' })
  }

  row(company: string, role: string): ApplicationRow {
    return new ApplicationRow(this.page, company, role)
  }

  async addApplication(
    company: string,
    role: string,
    jobDescription = 'Build reliable systems.',
  ): Promise<void> {
    await this.addButton().click()
    const dialog = new ApplicationDialog(this.page)
    await dialog.fill({ company, role, jobDescription })
    await dialog.submit()
    await dialog.expectHidden()
    await expect(this.page.getByText(company, { exact: true })).toBeVisible()
  }

  async edit(company: string, role: string): Promise<EditApplicationDialog> {
    await this.row(company, role).editButton().click()
    const dialog = new EditApplicationDialog(this.page)
    await expect(dialog.dialog()).toBeVisible()
    return dialog
  }

  async delete(company: string, role: string): Promise<void> {
    await this.row(company, role).deleteButton().click()
    const confirm = new ConfirmDialog(this.page)
    const deleted = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'DELETE' && response.ok(),
    )
    await confirm.confirm()
    await deleted
    await confirm.expectHidden()
  }

  async generateResume(
    company: string,
    role: string,
  ): Promise<ResumeDialog> {
    await this.row(company, role).generateResumeButton().click()
    const dialog = new ResumeDialog(this.page, `${role} at ${company}`)
    await dialog.expectVisible()
    return dialog
  }

  async viewResume(company: string, role: string): Promise<ResumeDialog> {
    await this.row(company, role).viewResumeButton().click()
    const dialog = new ResumeDialog(this.page, `${role} at ${company}`)
    await dialog.expectVisible()
    return dialog
  }

  async writeCoverLetter(
    company: string,
    role: string,
  ): Promise<CoverLetterDialog> {
    await this.row(company, role).writeCoverLetterButton().click()
    const dialog = new CoverLetterDialog(this.page, `${role} at ${company}`)
    await expect(dialog.dialog()).toBeVisible()
    return dialog
  }

  async viewCoverLetter(
    company: string,
    role: string,
  ): Promise<CoverLetterDialog> {
    await this.row(company, role).viewCoverLetterButton().click()
    const dialog = new CoverLetterDialog(this.page, `${role} at ${company}`)
    await expect(dialog.dialog()).toBeVisible()
    return dialog
  }

  async toggleDescription(company: string, role: string): Promise<void> {
    await this.row(company, role).descriptionToggle().click()
  }

  async expectEmpty(): Promise<void> {
    await expect(this.page.getByText('No applications yet')).toBeVisible()
  }

  async expectApplication(company: string): Promise<void> {
    await expect(this.page.getByText(company, { exact: true })).toBeVisible()
  }

  async expectNoApplication(company: string): Promise<void> {
    await expect(this.page.getByText(company)).toHaveCount(0)
  }

  async expectRole(role: string): Promise<void> {
    await expect(this.page.getByText(role, { exact: true })).toBeVisible()
  }

  async expectDescription(text: string, visible: boolean): Promise<void> {
    await expect(this.page.getByText(text))[visible ? 'toBeVisible' : 'toBeHidden']()
  }

  async expectApplied(text: string): Promise<void> {
    await expect(this.page.getByText(`Applied ${text}`).last()).toBeVisible()
  }

  async expectAddedColumnHidden(): Promise<void> {
    await expect(this.addedColumn()).toBeHidden()
  }

  async expectAddedLabel(): Promise<void> {
    await expect(this.page.getByText(/^Added /)).toBeVisible()
  }
}
