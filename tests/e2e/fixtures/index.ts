import { test as base, expect } from '@playwright/test'
import { AppShellPage } from '../pages/app-shell.page'
import { ApplicationsPage } from '../pages/applications/applications.page'
import { ProfilePage } from '../pages/profile/profile.page'
import { SettingsPage } from '../pages/settings/settings.page'
import type { TestFixtures } from './types'

export const test = base.extend<TestFixtures>({
  nav: async ({ page }, use) => {
    await use(new AppShellPage(page))
  },

  profile: async ({ page }, use) => {
    await use(new ProfilePage(page))
  },

  applications: async ({ page }, use) => {
    await use(new ApplicationsPage(page))
  },

  settings: async ({ page }, use) => {
    await use(new SettingsPage(page))
  },
})

export { expect }
