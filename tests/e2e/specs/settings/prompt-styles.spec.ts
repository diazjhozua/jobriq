import { test } from '../../fixtures'

test('creates a prompt style and uses it for generation', async ({
  page,
  nav,
  settings,
  profile,
}) => {
  await settings.open()

  await settings.promptStyles.expectBaselineVisible()
  await settings.promptStyles.expectNoSaved()

  await settings.promptStyles.create(
    'Warm voice',
    'Prefer warm, plain sentences.',
  )

  await settings.promptStyles.expectActive('Warm voice')
  await settings.promptStyles.expectInstructions(
    'Warm voice',
    'Prefer warm, plain sentences.',
  )

  await page.reload()
  await settings.promptStyles.expectActive('Warm voice')

  await nav.openProfile()
  await profile.personal.fill({ name: 'Jane Doe', email: 'jane@example.com' })
  await profile.entries.addExperience()
  await profile.entries.fillExperience(1, {
    company: 'Acme',
    title: 'Engineer',
  })
  await profile.entries.fillBullet('Experience', 1, 1, 'Built a thing')
  await profile.save()
  await profile.expectSaved()

  const dialog = await profile.openResume()
  await dialog.generate()

  await dialog.expectText(
    'Deterministic professional summary. [style: Warm voice]',
  )
  await dialog.expectText('Enhanced: Built a thing [style: Warm voice]')
})

test('switches the active style and falls back to the baseline on delete', async ({
  page,
  settings,
}) => {
  await settings.open()

  await settings.promptStyles.create(
    'Warm voice',
    'Prefer warm, plain sentences.',
  )
  await settings.promptStyles.create('Terse voice', 'Cut every extra word.')

  await settings.promptStyles.expectActive('Warm voice')

  await settings.promptStyles.setActive('Terse voice')
  await settings.promptStyles.expectActive('Terse voice')
  await settings.promptStyles.expectNotActive('Warm voice')

  await page.reload()
  await settings.promptStyles.expectActive('Terse voice')

  const confirm = await settings.promptStyles.delete('Terse voice')
  await confirm.confirm()
  await confirm.expectHidden()

  await settings.promptStyles.expectAbsent('Terse voice')
  await settings.promptStyles.expectBaselineActive()
  await settings.promptStyles.expectCanActivate('Warm voice')
})
