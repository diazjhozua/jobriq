import { useCallback, useState } from 'react'
import { downloadResume, type ExportFormat } from '../../lib/api'
import type { GeneratedResume } from '../../lib/types'

export function useResumeDownload(resume: GeneratedResume | null) {
  const [downloading, setDownloading] = useState<ExportFormat | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const download = useCallback(
    async (format: ExportFormat) => {
      if (!resume) {
        return
      }

      setDownloading(format)
      setDownloadError(null)

      try {
        await downloadResume(resume, format)
      } catch (caught) {
        setDownloadError(
          caught instanceof Error ? caught.message : 'The download failed.',
        )
      } finally {
        setDownloading(null)
      }
    },
    [resume],
  )

  const clearDownloadError = useCallback(() => setDownloadError(null), [])

  return { downloading, downloadError, download, clearDownloadError }
}
