import { expect, test } from '../../fixtures'

test('reviews the profile, applies a suggestion, and keeps the review in session', async ({
  page,
  nav,
  profile,
}) => {
  await profile.open()

  await profile.personal.fill({ name: 'Jane Doe', email: 'jane@example.com' })
  await profile.entries.addExperience()
  await profile.entries.fillExperience(1, {
    company: 'Acme',
    title: 'Engineer',
  })
  await profile.entries.fillBullet('Experience', 1, 1, 'Built a thing')

  const review = await profile.openReviewDialog()
  await review.expectText('Deterministic reviewed summary.')
  await review.expectText('Reviewed: Built a thing')
  await review.expectText('Group related skills')

  await review.applySuggestion('Add a professional summary')

  await review.close()
  await review.expectHidden()

  await profile.expectSummaryValue('Deterministic reviewed summary.')
  await expect(profile.saveButton()).toBeEnabled()

  await profile.save()
  await profile.expectSaved()

  await nav.openApplications()
  await nav.openProfile()
  await profile.review.openSuggestions()
  await profile.review.expectSuggestion('Add a professional summary')

  await page.reload()
  await profile.expectSummaryValue('Deterministic reviewed summary.')
  await profile.review.expectNoSuggestion('Add a professional summary')
})

test('opens the review dialog from a deep link', async ({ profile }) => {
  await profile.openReviewDeepLink()

  const review = profile.reviewDialog()
  await review.expectVisible()
  await review.expectEmpty()
})
