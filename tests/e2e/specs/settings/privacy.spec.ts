import { test } from '../../fixtures'

test('toggles PII masking and keeps it across reloads', async ({
  page,
  settings,
}) => {
  await settings.open()

  await settings.privacy.expectEnabled()

  await settings.privacy.set(false)
  await settings.privacy.expectDisabled()

  await page.reload()
  await settings.privacy.expectDisabled()

  await settings.privacy.set(true)
  await settings.privacy.expectEnabled()
})
