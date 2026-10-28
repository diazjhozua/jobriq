import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import type {
  ProfileReview,
  ReviewCategory,
  ReviewSection,
  ReviewSuggestion,
} from '../../lib/types'

interface ProfileReviewPanelProps {
  review: ProfileReview | null
  reviewedAt: string | null
  reviewing: boolean
  saving: boolean
  error: string | null
  onReview: () => void
  onApply: (suggestion: ReviewSuggestion) => boolean
}

const SECTION_ORDER: ReviewSection[] = [
  'summary',
  'experience',
  'projects',
  'skills',
  'education',
  'personal',
]

const SECTION_LABELS: Record<ReviewSection, string> = {
  personal: 'Personal details',
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
}

const CATEGORY_LABELS: Record<ReviewCategory, string> = {
  completeness: 'Completeness',
  impact: 'Impact',
  clarity: 'Clarity',
}

function reviewTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function ProfileReviewPanel({
  review,
  reviewedAt,
  reviewing,
  saving,
  error,
  onReview,
  onApply,
}: ProfileReviewPanelProps) {
  const [applied, setApplied] = useState<Set<string>>(() => new Set())
  const [staleId, setStaleId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const apply = (suggestion: ReviewSuggestion) => {
    if (onApply(suggestion)) {
      setApplied((current) => new Set(current).add(suggestion.id))
      setStaleId(null)
      setAnnouncement(`Applied suggestion: ${suggestion.title}`)
      return
    }

    setStaleId(suggestion.id)
  }

  const startReview = () => {
    setAnnouncement('')
    onReview()
  }

  const statusMessage = reviewing
    ? 'Reviewing your profile...'
    : announcement ||
      (review ? 'Review complete. Suggestions ready.' : '')

  return (
    <aside
      aria-label="Profile review"
      aria-busy={reviewing}
      className="min-w-0 lg:sticky lg:top-20 lg:z-10 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
    >
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Profile review</h2>
            <div className="mt-2 h-0.5 w-10 bg-accent" aria-hidden="true" />
          </div>
        </div>

        <p className="mt-3 text-sm text-muted">
          Get job-agnostic feedback on this profile before you apply. Nothing is
          saved until you save the profile.
        </p>

        <Button
          variant="primary"
          className="mt-4 w-full"
          onClick={startReview}
          disabled={reviewing}
        >
          {review ? 'Review again' : 'Review profile'}
        </Button>

        <p role="status" className="sr-only">
          {statusMessage}
        </p>

        {reviewing ? (
          <p className="mt-4 text-sm text-muted">Reviewing your profile...</p>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 text-sm text-body">
            {error}
          </p>
        ) : null}

        {!review && !reviewing && !error ? (
          <p className="mt-4 text-sm text-muted">
            The review looks at your summary, experience, projects, skills,
            education, and personal details. Run it as often as you like.
          </p>
        ) : null}

        {review ? (
          <div className="mt-5">
            <p className="text-xs text-muted">
              {review.suggestions.length === 1
                ? '1 suggestion'
                : `${review.suggestions.length} suggestions`}
              {reviewedAt ? ` · ${reviewTime(reviewedAt)}` : ''}
            </p>

            {review.suggestions.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No suggestions right now.</p>
            ) : (
              <div className="mt-3 space-y-5">
                {SECTION_ORDER.map((section) => {
                  const suggestions = review.suggestions.filter(
                    (suggestion) => suggestion.section === section,
                  )

                  if (suggestions.length === 0) {
                    return null
                  }

                  return (
                    <section key={section} aria-labelledby={`review-${section}`}>
                      <h3
                        id={`review-${section}`}
                        className="text-xs font-semibold uppercase tracking-wide text-muted"
                      >
                        {SECTION_LABELS[section]}
                      </h3>
                      <ul className="mt-2 space-y-3">
                        {suggestions.map((suggestion) => {
                          const isApplied = applied.has(suggestion.id)
                          const isStale = staleId === suggestion.id

                          return (
                            <li
                              key={suggestion.id}
                              className="rounded-md border border-border bg-canvas p-3"
                            >
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                {CATEGORY_LABELS[suggestion.category]}
                              </p>
                              <p className="mt-1 break-words text-sm font-semibold text-navy">
                                {suggestion.title}
                              </p>
                              {suggestion.detail ? (
                                <p className="mt-1 break-words text-sm text-muted">
                                  {suggestion.detail}
                                </p>
                              ) : null}

                              {suggestion.originalText ? (
                                <p className="mt-2 break-words text-xs text-muted">
                                  Replaces: {suggestion.originalText}
                                </p>
                              ) : null}

                              {suggestion.proposedText ? (
                                <p className="mt-2 whitespace-pre-wrap break-words rounded-md border border-border bg-surface p-2 text-sm">
                                  <span className="sr-only">Proposed: </span>
                                  {suggestion.proposedText}
                                </p>
                              ) : null}

                              {suggestion.proposedText ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-3"
                                  onClick={() => apply(suggestion)}
                                  disabled={reviewing || saving || isApplied}
                                  aria-label={
                                    isApplied
                                      ? `Applied suggestion: ${suggestion.title}`
                                      : `Apply suggestion: ${suggestion.title}`
                                  }
                                >
                                  {isApplied ? 'Applied' : 'Apply'}
                                </Button>
                              ) : null}

                              {isStale ? (
                                <p role="alert" className="mt-2 text-xs text-body">
                                  This suggestion no longer matches the form. Run the
                                  review again.
                                </p>
                              ) : null}
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  )
                })}
              </div>
            )}
          </div>
        ) : null}
      </Card>
    </aside>
  )
}
