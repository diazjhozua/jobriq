import { expect, type Locator, type Page } from '@playwright/test'

export async function documentOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
}

export async function tableCardOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const table = document.querySelector('table')
    const card = table?.parentElement
    return card ? card.scrollWidth - card.clientWidth : -1
  })
}

export async function dialogOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    return dialog ? dialog.scrollWidth - dialog.clientWidth : -1
  })
}

export async function settleAnimations(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished)),
  )
}

export async function disableSmoothScroll(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto'
  })
}

export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  )
}

export async function scrollToTop(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, 0))
}

export async function boundingBox(locator: Locator): Promise<{
  x: number
  y: number
  width: number
  height: number
}> {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  return box!
}
