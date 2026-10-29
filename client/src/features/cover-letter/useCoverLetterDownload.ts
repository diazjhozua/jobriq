import { useCallback, useRef, useState } from 'react'
import { downloadCoverLetter } from '../../lib/api'
import type { CoverLetter } from '../../lib/types'

export function useCoverLetterDownload(letter: CoverLetter | null) {
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const requestId = useRef(0)

  const download = useCallback(async () => {
    if (!letter) {
      return
    }

    const id = ++requestId.current
    setDownloading(true)
    setDownloadError(null)

    try {
      await downloadCoverLetter(letter)
    } catch (caught) {
      if (id === requestId.current) {
        setDownloadError(
          caught instanceof Error ? caught.message : 'The download failed.',
        )
      }
    } finally {
      if (id === requestId.current) {
        setDownloading(false)
      }
    }
  }, [letter])

  const reset = useCallback(() => {
    requestId.current++
    setDownloading(false)
    setDownloadError(null)
  }, [])

  return { downloading, downloadError, download, reset }
}
