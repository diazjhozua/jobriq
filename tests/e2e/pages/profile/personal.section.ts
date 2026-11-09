import { expect, type Locator, type Page } from '@playwright/test'

export type PersonalValues = {
  name?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  github?: string
  website?: string
}

export class ProfilePersonalSection {
  constructor(private readonly page: Page) {}

  private region(): Locator {
    return this.page.getByRole('region', { name: 'Personal details' })
  }

  field(label: string): Locator {
    return this.region().getByLabel(label)
  }

  summary(): Locator {
    return this.page.getByRole('textbox', { name: 'Summary' })
  }

  async fill(values: PersonalValues): Promise<void> {
    for (const [label, value] of Object.entries(values)) {
      if (value === undefined) {
        continue
      }

      const field = {
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        location: 'Location',
        linkedin: 'LinkedIn',
        github: 'GitHub',
        website: 'Website',
      }[label as keyof PersonalValues]

      await this.field(field).fill(value)
    }
  }

  async expectField(label: string, value: string): Promise<void> {
    await expect(this.field(label)).toHaveValue(value)
  }
}
