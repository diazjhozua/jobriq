import { Button } from '../../components/ui/button'
import type {
  ProfileReview,
  ReviewCategory,
  ReviewSection,
  ReviewSuggestion,
} from '../../lib/types'

interface ProfileReviewPanelProps {
  review: ProfileReview | null
  reviewing: boolean
  saving: boolean
  applied: ReadonlySet<string>
  staleId: string | null
  onApply: (suggestion: ReviewSuggestion) => void
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

export function ProfileReviewPanel({
  review,
  reviewing,
  saving,
  applied,
  staleId,
  onApply,
}: ProfileReviewPanelProps) {
  return (
    <div
      id="profile-review"
      tabIndex={-1}
      aria-busy={reviewing}
      className="min-w-0 focus:outline-none"
    >
      {!review && reviewing ? (
        <p className="text-[0.85rem] leading-6 text-muted">
          Reviewing your profile...
        </p>
      ) : review ? (
        review.suggestions.length === 0 ? (
          <p className="text-[0.85rem] italic text-muted">
            No suggestions right now.
          </p>
        ) : (
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {SECTION_ORDER.map((section) => {
              const suggestions = review.suggestions.filter(
                (suggestion) => suggestion.section === section,
              )

              if (suggestions.length === 0) {
                return null
              }

              return (
                <section
                  key={section}
                  aria-labelledby={`review-${section}`}
                  className="min-w-0"
                >
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
                              onClick={() => {
                                if (reviewing || saving || isApplied) {
                                  return
                                }
                                onApply(suggestion)
                              }}
                              aria-disabled={reviewing || saving || isApplied}
                              className={
                                reviewing || saving || isApplied
                                  ? 'mt-3 pointer-events-none opacity-45'
                                  : 'mt-3'
                              }
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
        )
      ) : (
        <p className="text-[0.85rem] leading-6 text-muted">
          No review yet. Run Review profile to get suggestions.
        </p>
      )}
    </div>
  )
}
