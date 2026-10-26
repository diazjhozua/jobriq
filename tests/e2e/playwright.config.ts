import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  globalTeardown: './global-teardown.ts',
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
    command: 'node ./start-server.mjs',
    url: 'http://localhost:5081',
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
