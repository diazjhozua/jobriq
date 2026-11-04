import { useCallback, useState } from 'react'
import { downloadProfile } from '../../lib/api'
import type { Profile } from '../../lib/types'

export function useProfileExport() {
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const exportProfile = useCallback(async (profile: Profile) => {
    setExporting(true)
    setExportError(null)

    try {
      await downloadProfile(profile)
    } catch (caught) {
      setExportError(
        caught instanceof Error ? caught.message : 'The export failed.',
      )
    } finally {
      setExporting(false)
    }
  }, [])

  return { exporting, exportError, exportProfile }
}
