import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5081',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command:
      'npm --prefix ../.. run build && dotnet run --project ../../src/Jobriq.Web --urls http://localhost:5081 --no-launch-profile -- --environment Testing',
    url: 'http://localhost:5081',
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
