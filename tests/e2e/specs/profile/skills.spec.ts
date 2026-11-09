import { test } from '../../fixtures'

test('compiles skills gained in entries into the overall Skills list', async ({
  page,
  profile,
}) => {
  await profile.open()

  await profile.personal.fill({ name: 'Jane Doe', email: 'jane@example.com' })
  await profile.entries.addExperience()
  await profile.entries.fillExperience(1, {
    company: 'Acme',
    title: 'Engineer',
  })

  await profile.entries.addSkillsGained('Experience', 1, ['Docker', 'Kubernetes'])

  await profile.skills.expectSuggestionsVisible()
  await profile.skills.addSuggested('Docker')
  await profile.skills.addAllMissing()

  await profile.skills.expectTag('Docker')
  await profile.skills.expectTag('Kubernetes')
  await profile.skills.expectSuggestionsHidden()

  await profile.save()
  await profile.expectSaved()

  await page.reload()
  await profile.skills.expectEntryTag('Experience', 1, 'Docker')
  await profile.skills.expectTag('Docker')
})
