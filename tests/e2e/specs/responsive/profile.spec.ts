import { expect, test } from '../../fixtures'
import {
  disableSmoothScroll,
  scrollToBottom,
  scrollToTop,
  settleAnimations,
} from '../../support/layout'

test('keeps the profile header and resume dialog usable at 320px', async ({
  page,
  profile,
}) => {
  await page.setViewportSize({ width: 320, height: 812 })
  await profile.open()

  await expect(profile.resumeButton()).toBeVisible()
  await profile.review.expectControlsVisible()
  await profile.expectSaveButtonHidden()

  await profile.personal.field('Name').fill('Jane Doe')
  await profile.expectSaveBarVisible()
  await profile.expectSaveButtonVisible()

  await settleAnimations(page)

  await profile.expectReviewLauncherAboveSaveBar()
  await profile.expectSaveBarWithinViewport(812)

  await scrollToBottom(page)
  await profile.expectReviewLauncherAboveSaveBar()
  await scrollToTop(page)

  await profile.expectNoDocumentOverflow()

  await profile.entries.addCertification()
  await profile.entries.addAward()

  await profile.expectNoDocumentOverflow()

  const review = await profile.openReviewDialog()
  await review.expectInViewport()
  await review.expectNoHorizontalOverflow()

  await review.close()
  await review.expectHidden()

  const dialog = await profile.openResume()
  await dialog.expectVisible()
  await dialog.expectNoHorizontalOverflow()
})

test('keeps the last project field above the save bar', async ({
  page,
  profile,
}) => {
  await profile.open()

  await profile.personal.field('Name').fill('Jane Doe')
  await profile.entries.addProject()
  await profile.entries.fillProject(1, { name: 'Jobriq' })
  await profile.entries.fillBullet('Project', 1, 1, 'Built a resume builder')

  await disableSmoothScroll(page)
  await scrollToBottom(page)

  await profile.expectLastProjectBulletAboveSaveBar(1, 1)
})
