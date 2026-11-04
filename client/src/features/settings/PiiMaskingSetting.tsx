import { useState, type ChangeEvent } from 'react'
import { useJobriq } from '../../providers/JobriqProvider'

export function PiiMaskingSetting() {
  const { piiMasking, setPiiMasking } = useJobriq()
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (pending) {
      return
    }

    const enabled = event.target.checked
    setPending(true)
    setFailed(false)

    void setPiiMasking(enabled)
      .catch(() => {
        // The provider surfaces the error in the sync banner.
        setFailed(true)
      })
      .finally(() => setPending(false))
  }

  return (
    <div className="flex items-start gap-3">
      <input
        id="pii-masking-enabled"
        type="checkbox"
        role="switch"
        aria-checked={piiMasking.enabled}
        aria-describedby="pii-masking-description"
        aria-busy={pending}
        aria-disabled={pending}
        checked={piiMasking.enabled}
        onChange={handleChange}
        className="mt-1 h-5 w-5 shrink-0 accent-primary"
      />

      <div className="min-w-0">
        <label
          htmlFor="pii-masking-enabled"
          className="text-[0.95rem] font-medium"
        >
          Redact personal details before AI requests
        </label>
        <p
          id="pii-masking-description"
          className="mt-1 max-w-[62ch] text-[0.85rem] leading-6 text-muted"
        >
          Your name, email, phone, location, and links are replaced with
          [redacted] before profile text reaches the AI provider. The saved
          profile, previews, and exports keep the real values. Turn this off only
          if you need the AI to see them.
        </p>
        <p aria-live="polite" className="mt-2 text-[0.8rem] text-muted">
          {pending
            ? 'Saving…'
            : failed
              ? 'The privacy setting could not be saved.'
              : piiMasking.enabled
                ? 'Personal details are hidden from AI requests.'
                : 'Personal details are sent to the AI provider.'}
        </p>
      </div>
    </div>
  )
}
