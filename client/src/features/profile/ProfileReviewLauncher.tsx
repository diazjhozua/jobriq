import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import type { ProfileReview, ReviewSuggestion } from '../../lib/types'
import { cn } from '../../lib/utils'
import { ProfileReviewPanel } from './ProfileReviewPanel'

interface ProfileReviewLauncherProps {
  review: ProfileReview | null
  reviewedAt: string | null
  reviewing: boolean
  saving: boolean
  error: string | null
  saveBarVisible: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onReview: () => void
  onApply: (suggestion: ReviewSuggestion) => boolean
}

function reviewTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function ProfileReviewLauncher({
  review,
  reviewedAt,
  reviewing,
  saving,
  error,
  saveBarVisible,
  open,
  onOpenChange,
  onReview,
  onApply,
}: ProfileReviewLauncherProps) {
  const [applied, setApplied] = useState<ReadonlySet<string>>(() => new Set())
  const [staleId, setStaleId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [reviewedFor, setReviewedFor] = useState(reviewedAt)

  if (reviewedAt !== reviewedFor) {
    setReviewedFor(reviewedAt)
    setApplied(new Set())
    setStaleId(null)
    setAnnouncement('')
  }

  const apply = (suggestion: ReviewSuggestion) => {
    if (onApply(suggestion)) {
      setApplied((current) => new Set(current).add(suggestion.id))
      setStaleId(null)
      setAnnouncement(`Applied suggestion: ${suggestion.title}`)
      return
    }

    setStaleId(suggestion.id)
  }

  const beginReview = () => {
    if (reviewing) {
      return
    }

    setAnnouncement('')
    onOpenChange(true)
    onReview()
  }

  const openReview = () => {
    if (review || reviewing) {
      onOpenChange(true)
      return
    }

    beginReview()
  }

  const count = review?.suggestions.length ?? 0
  const summary = reviewing
    ? 'Reviewing your profile...'
    : review
      ? `${count === 1 ? '1 suggestion' : `${count} suggestions`}${
          reviewedAt ? ` · ${reviewTime(reviewedAt)}` : ''
        }`
      : 'Job-agnostic feedback on this profile before you apply.'

  const statusMessage = reviewing
    ? 'Reviewing your profile...'
    : announcement ||
      (error
        ? 'Review failed.'
        : review
          ? count === 0
            ? 'Review complete. No suggestions.'
            : 'Review complete. Suggestions ready.'
          : '')

  const pillLabel = reviewing
    ? 'Reviewing…'
    : review
      ? count === 0
        ? 'View review'
        : 'Review suggestions'
      : 'Review profile'

  const action = (
    <Button
      variant="outline"
      size="sm"
      onClick={beginReview}
      aria-disabled={reviewing}
      className={reviewing ? 'pointer-events-none opacity-45' : undefined}
    >
      {reviewing ? (
        <Loader2
          aria-hidden="true"
          size={15}
          className="animate-spin motion-reduce:animate-none"
        />
      ) : null}
      {review ? 'Review again' : 'Review profile'}
    </Button>
  )

  const pill = (
    <div
      role="region"
      aria-label="Profile review controls"
      className={cn(
        'fixed right-4 z-30 transition-[bottom] duration-150 motion-reduce:transition-none sm:right-6',
        saveBarVisible ? 'bottom-32' : 'bottom-4 sm:bottom-6',
      )}
    >
      {open ? null : (
        <p role="status" className="sr-only">
          {statusMessage}
        </p>
      )}
      <Button
        id="profile-review-action"
        variant="primary"
        className="h-11 rounded-full px-5 shadow-sheet"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? 'profile-review-dialog' : undefined}
        aria-label={
          review && count > 0
            ? `${pillLabel} (${count})`
            : pillLabel
        }
        onClick={openReview}
      >
        {reviewing ? (
          <Loader2
            aria-hidden="true"
            size={16}
            className="animate-spin motion-reduce:animate-none"
          />
        ) : (
          <Sparkles aria-hidden="true" size={16} />
        )}
        <span>{pillLabel}</span>
        {review && count > 0 ? (
          <span
            aria-hidden="true"
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface/20 px-1.5 text-[0.7rem] font-medium"
          >
            {count}
          </span>
        ) : null}
      </Button>
    </div>
  )

  return (
    <>
      {createPortal(pill, document.body)}
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title="Profile review"
        description={summary}
        className="max-w-4xl"
        contentId="profile-review-dialog"
        actions={action}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          document.getElementById('profile-review')?.focus()
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          document.getElementById('profile-review-action')?.focus()
        }}
      >
        <p role="status" className="sr-only">
          {statusMessage}
        </p>
        {error ? (
          <p
            role="alert"
            className="mb-4 break-words border-l-2 border-accent bg-canvas px-3 py-2 text-[0.85rem] leading-6 text-body"
          >
            {error}
          </p>
        ) : null}
        <ProfileReviewPanel
          review={review}
          reviewing={reviewing}
          saving={saving}
          applied={applied}
          staleId={staleId}
          onApply={apply}
        />
      </Dialog>
    </>
  )
}
