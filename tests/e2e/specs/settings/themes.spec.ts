import { test } from '../../fixtures'

test('creates a resume theme and keeps the active design across reloads', async ({
  page,
  settings,
}) => {
  await settings.open()

  await settings.themes.expectBuiltIns([
    'Classic',
    'Modern',
    'Compact',
    'Editorial',
    'Monochrome',
  ])
  await settings.themes.expectActive('Classic')
  await settings.themes.expectReadOnly('Classic')
  await settings.themes.expectNoSaved()

  await settings.themes.create('Warm serif')

  await settings.themes.expectSavedTheme('Warm serif')
  await settings.themes.expectNotActive('Warm serif')

  await settings.themes.setActive('Warm serif')
  await settings.themes.expectActive('Warm serif')
  await settings.themes.expectNotActive('Classic')

  await page.reload()
  await settings.themes.expectActive('Warm serif')
  await settings.themes.expectNotActive('Classic')
})

test('previews a theme without activating it', async ({ settings }) => {
  await settings.open()

  await settings.themes.expectPreviewing('Classic')

  await settings.themes.previewTheme('Modern')

  await settings.themes.expectPreviewing('Modern')
  await settings.themes.expectPreviewPressed('Modern')
  await settings.themes.expectActive('Classic')
  await settings.themes.expectNotActive('Modern')
})

test('falls back to Classic when the active custom theme is deleted', async ({
  settings,
}) => {
  await settings.open()

  await settings.themes.create('Warm serif')
  await settings.themes.setActive('Warm serif')
  await settings.themes.expectActive('Warm serif')

  const confirm = await settings.themes.delete('Warm serif')
  await confirm.confirm()
  await confirm.expectHidden()

  await settings.themes.expectAbsent('Warm serif')
  await settings.themes.expectActive('Classic')
  await settings.themes.expectNoSaved()
})
