import type { AppShellPage } from '../pages/app-shell.page'
import type { ApplicationsPage } from '../pages/applications/applications.page'
import type { ProfilePage } from '../pages/profile/profile.page'
import type { SettingsPage } from '../pages/settings/settings.page'

export type TestFixtures = {
  nav: AppShellPage
  profile: ProfilePage
  applications: ApplicationsPage
  settings: SettingsPage
}
