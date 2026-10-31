import { useState } from 'react'
import { Button } from '../../components/ui/button'
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
  'education',
  'certifications',
  'awards',
  'skills',
  'projects',
  'personal',
]

const SECTION_LABELS: Record<ReviewSection, string> = {
  personal: 'Personal details',
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  certifications: 'Licenses & certifications',
  awards: 'Honors & awards',
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
      id="profile-review"
      aria-label="Profile review"
      aria-busy={reviewing}
      tabIndex={-1}
      className="min-w-0 scroll-mt-[7.75rem] lg:sticky lg:top-[7.75rem] lg:z-10 lg:max-h-[calc(100vh-9.25rem)] lg:overflow-y-auto lg:border-l lg:border-border lg:pl-6"
    >
      <div>
        <h2 className="text-[1.3rem] font-medium leading-tight">Profile review</h2>
        <p className="mt-2 text-[0.8rem] leading-5 text-muted">
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
          <p className="mt-4 text-[0.85rem] text-muted">Reviewing your profile...</p>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 border-l-2 border-accent pl-3 text-[0.85rem] leading-6 text-body">
            {error}
          </p>
        ) : null}

        {!review && !reviewing && !error ? (
          <p className="mt-4 text-[0.85rem] leading-6 text-muted">
            The review looks at every section of your profile. Run it as often
            as you like.
          </p>
        ) : null}

        {review ? (
          <div className="mt-5">
            <p className="text-[0.75rem] text-muted">
              {review.suggestions.length === 1
                ? '1 suggestion'
                : `${review.suggestions.length} suggestions`}
              {reviewedAt ? ` · ${reviewTime(reviewedAt)}` : ''}
            </p>

            {review.suggestions.length === 0 ? (
              <p className="mt-3 text-[0.85rem] italic text-muted">
                No suggestions right now.
              </p>
            ) : (
              <div className="mt-4 space-y-6">
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
                        className="font-sans text-[0.72rem] font-medium tracking-[0.01em] text-muted"
                      >
                        {SECTION_LABELS[section]}
                      </h3>
                      <ul className="mt-2">
                        {suggestions.map((suggestion) => {
                          const isApplied = applied.has(suggestion.id)
                          const isStale = staleId === suggestion.id

                          return (
                            <li
                              key={suggestion.id}
                              className="border-t border-border py-3 first:border-t-0 first:pt-0"
                            >
                              <p className="text-[0.7rem] font-medium text-accent">
                                {CATEGORY_LABELS[suggestion.category]}
                              </p>
                              <p className="mt-1 break-words text-[0.85rem] font-medium leading-5 text-navy">
                                {suggestion.title}
                              </p>
                              {suggestion.detail ? (
                                <p className="mt-1 break-words text-[0.8rem] leading-5 text-muted">
                                  {suggestion.detail}
                                </p>
                              ) : null}

                              {suggestion.originalText ? (
                                <p className="mt-2 break-words text-[0.75rem] leading-5 text-muted">
                                  Replaces: {suggestion.originalText}
                                </p>
                              ) : null}

                              {suggestion.proposedText ? (
                                <p className="mt-2 whitespace-pre-wrap break-words border-l-2 border-accent bg-surface px-3 py-2 text-[0.8rem] leading-5">
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
                                <p role="alert" className="mt-2 text-[0.75rem] leading-5 text-body">
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
      </div>
    </aside>
  )
}
