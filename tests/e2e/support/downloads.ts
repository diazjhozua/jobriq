import { readFile } from 'node:fs/promises'
import type { Download, Page } from '@playwright/test'

/**
 * Registers the download waiter before the trigger runs, so a fast download
 * cannot land before the listener exists.
 */
export async function captureDownload(
  page: Page,
  trigger: () => Promise<unknown>,
): Promise<Download> {
  const pending = page.waitForEvent('download')
  await trigger()
  return pending
}

export async function downloadText(download: Download): Promise<string> {
  const path = await download.path()

  if (!path) {
    throw new Error(`The download ${download.suggestedFilename()} has no local path.`)
  }

  return readFile(path, 'utf8')
}
