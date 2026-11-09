import { expect, test } from '../../fixtures'

test('lays out the theme form and preview side by side', async ({
  page,
  settings,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await settings.open()

  const dialog = await settings.themes.openNewTheme()

  await dialog.expectPreviewVisible()
  await dialog.expectPreviewRightOfNameField()
})

test('keeps the theme preview inside the viewport at 375px', async ({
  page,
  settings,
}) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await settings.open()

  const preview = settings.themes.preview()
  await expect(preview).toBeVisible()

  await settings.themes.previewTheme('Modern')
  await settings.themes.expectPreviewing('Modern')

  await settings.expectNoDocumentOverflow()
})
