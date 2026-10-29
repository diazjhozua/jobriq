import { useCallback, useEffect, useRef, useState } from 'react'

const FEEDBACK_MS = 2000
const DEFAULT_ERROR = 'The text could not be copied to the clipboard.'

export function useCopyToClipboard(errorMessage = DEFAULT_ERROR) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current)
      }
    },
    [],
  )

  const reset = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }

    setCopied(false)
    setCopyError(null)
  }, [])

  const copy = useCallback(
    async (text: string) => {
      setCopyError(null)

      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)

        if (timer.current !== null) {
          window.clearTimeout(timer.current)
        }

        timer.current = window.setTimeout(() => setCopied(false), FEEDBACK_MS)
      } catch {
        setCopyError(errorMessage)
      }
    },
    [errorMessage],
  )

  return { copied, copyError, copy, reset }
}
