import { expect, type Locator, type Page } from '@playwright/test'
import { pickMonthYear, pickPresent } from '../../support/month-year'

export type EntrySection =
  | 'Experience'
  | 'Education'
  | 'Certification'
  | 'Award'
  | 'Project'

export class ProfileEntriesSection {
  constructor(private readonly page: Page) {}

  async addExperience(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add experience' }).click()
  }

  async addEducation(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add education' }).click()
  }

  async addCertification(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add certification' }).click()
  }

  async addAward(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add award' }).click()
  }

  async addProject(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add project' }).click()
  }

  group(section: EntrySection, index: number): Locator {
    return this.page.getByRole('group', { name: `${section} ${index}` })
  }

  field(section: EntrySection, index: number, label: string): Locator {
    return this.group(section, index).getByLabel(label, { exact: true })
  }

  /** Optional fields render their label with a suffix such as " (optional)". */
  looseField(section: EntrySection, index: number, label: string): Locator {
    return this.group(section, index).getByLabel(label)
  }

  /** A filled combobox also renders a Clear button that shares the label. */
  comboboxField(section: EntrySection, index: number, label: string): Locator {
    return this.group(section, index).getByRole('combobox', { name: label })
  }

  bullet(section: EntrySection, index: number, bullet: number): Locator {
    return this.group(section, index).getByRole('textbox', {
      name: `${section} ${index} bullet ${bullet}`,
      exact: true,
    })
  }

  skillsGained(section: EntrySection, index: number): Locator {
    return this.group(section, index).getByRole('textbox', {
      name: `${section} ${index} skills gained`,
      exact: true,
    })
  }

  navLink(label: string): Locator {
    return this.page.getByRole('link', { name: label })
  }

  async fillExperience(
    index: number,
    values: { company?: string; title?: string },
  ): Promise<void> {
    if (values.company !== undefined) {
      await this.field('Experience', index, 'Company').fill(values.company)
    }

    if (values.title !== undefined) {
      await this.field('Experience', index, 'Title').fill(values.title)
    }
  }

  async fillEducation(
    index: number,
    values: { school?: string; degree?: string; field?: string },
  ): Promise<void> {
    if (values.school !== undefined) {
      await this.field('Education', index, 'School').fill(values.school)
    }

    if (values.degree !== undefined) {
      await this.field('Education', index, 'Degree').fill(values.degree)
    }

    if (values.field !== undefined) {
      await this.field('Education', index, 'Field').fill(values.field)
    }
  }

  async fillCertification(
    index: number,
    values: {
      name?: string
      issuer?: string
      credentialId?: string
      credentialUrl?: string
    },
  ): Promise<void> {
    if (values.name !== undefined) {
      await this.field('Certification', index, 'Name').fill(values.name)
    }

    if (values.issuer !== undefined) {
      await this.field('Certification', index, 'Issuing organization').fill(
        values.issuer,
      )
    }

    if (values.credentialId !== undefined) {
      await this.field('Certification', index, 'Credential ID').fill(
        values.credentialId,
      )
    }

    if (values.credentialUrl !== undefined) {
      await this.field('Certification', index, 'Credential URL').fill(
        values.credentialUrl,
      )
    }
  }

  async fillAward(
    index: number,
    values: {
      title?: string
      associated?: string
      issuer?: string
      description?: string
    },
  ): Promise<void> {
    if (values.title !== undefined) {
      await this.field('Award', index, 'Title').fill(values.title)
    }

    if (values.associated !== undefined) {
      await this.comboboxField('Award', index, 'Associated with').fill(
        values.associated,
      )
    }

    if (values.issuer !== undefined) {
      await this.field('Award', index, 'Issuer').fill(values.issuer)
    }

    if (values.description !== undefined) {
      await this.field('Award', index, 'Description').fill(values.description)
    }
  }

  async fillProject(
    index: number,
    values: { name?: string; description?: string; url?: string },
  ): Promise<void> {
    if (values.name !== undefined) {
      await this.field('Project', index, 'Name').fill(values.name)
    }

    if (values.description !== undefined) {
      await this.looseField('Project', index, 'Description').fill(
        values.description,
      )
    }

    if (values.url !== undefined) {
      await this.looseField('Project', index, 'URL').fill(values.url)
    }
  }

  async pickStart(
    section: EntrySection,
    index: number,
    month: string,
    year: string,
  ): Promise<void> {
    await pickMonthYear(
      this.page,
      this.field(section, index, 'Start date'),
      `${section} ${index} start date`,
      month,
      year,
    )
  }

  async pickEndPresent(section: EntrySection, index: number): Promise<void> {
    await pickPresent(this.page, this.field(section, index, 'End date'))
  }

  async pickIssueDate(
    section: EntrySection,
    index: number,
    month: string,
    year: string,
  ): Promise<void> {
    await pickMonthYear(
      this.page,
      this.field(section, index, 'Issue date'),
      `${section} ${index} issue date`,
      month,
      year,
    )
  }

  async fillBullet(
    section: EntrySection,
    index: number,
    bullet: number,
    text: string,
  ): Promise<void> {
    await this.bullet(section, index, bullet).fill(text)
  }

  async addSkillsGained(
    section: EntrySection,
    index: number,
    tags: string[],
  ): Promise<void> {
    const field = this.skillsGained(section, index)
    await field.fill(tags.join(', '))
    await field.press('Enter')
  }

  async expectNav(label: string): Promise<void> {
    await expect(this.navLink(label)).toBeVisible()
  }

  async expectFieldValue(
    section: EntrySection,
    index: number,
    label: string,
    value: string,
  ): Promise<void> {
    await expect(this.field(section, index, label)).toHaveValue(value)
  }

  async expectLooseFieldValue(
    section: EntrySection,
    index: number,
    label: string,
    value: string,
  ): Promise<void> {
    await expect(this.looseField(section, index, label)).toHaveValue(value)
  }

  async expectComboboxValue(
    section: EntrySection,
    index: number,
    label: string,
    value: string,
  ): Promise<void> {
    await expect(
      this.comboboxField(section, index, label),
    ).toHaveValue(value)
  }

  async expectDateField(
    section: EntrySection,
    index: number,
    label: string,
    value: string,
  ): Promise<void> {
    await expect(this.field(section, index, label)).toContainText(value)
  }
}
