import { Check } from 'lucide-react'
import { Button } from '../../components/ui/button'

interface ProfileSaveBarProps {
  dirty: boolean
  saved: boolean
  submitting: boolean
}

export function ProfileSaveBar({ dirty, saved, submitting }: ProfileSaveBarProps) {
  if (!dirty && !saved) {
    return null
  }

  return (
    <div
      id="profile-save-bar"
      role="region"
      aria-label="Profile save"
      className="save-bar-enter px-5 py-3 sm:px-8"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-[0.8rem] text-muted">
          {submitting ? (
            'Saving…'
          ) : saved && !dirty ? (
            <>
              <Check aria-hidden="true" size={15} className="text-primary" />
              Saved
            </>
          ) : null}
        </span>
        <Button
          type="submit"
          variant="primary"
          className="ml-auto shrink-0"
          disabled={submitting || !dirty}
        >
          Save profile
        </Button>
      </div>
    </div>
  )
}
