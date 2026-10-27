import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { ProfileReview, ReviewSuggestion } from '../../lib/types'
import { ProfileReviewPanel } from './ProfileReviewPanel'

const reviewedAt = '2026-10-27T10:15:00.000Z'

function suggestion(
  overrides: Partial<ReviewSuggestion> & Pick<ReviewSuggestion, 'id' | 'section'>,
): ReviewSuggestion {
  return {
    itemId: null,
    bulletIndex: null,
    category: 'clarity',
    title: 'Improve this section',
    detail: 'Explain why this matters.',
    originalText: null,
    proposedText: null,
    ...overrides,
  }
}

const review: ProfileReview = {
  suggestions: [
    suggestion({
      id: 'summary-1',
      section: 'summary',
      category: 'completeness',
      title: 'Add a summary',
      originalText: 'Old summary',
      proposedText: 'New summary',
    }),
    suggestion({
      id: 'experience-1',
      section: 'experience',
      category: 'impact',
      title: 'Quantify impact',
      itemId: 'experience-id',
      bulletIndex: 0,
      originalText: 'Built a thing',
      proposedText: 'Built a thing for 100 users',
    }),
    suggestion({
      id: 'skills-1',
      section: 'skills',
      title: 'Group related skills',
    }),
  ],
}

function renderPanel(
  overrides: Partial<ComponentProps<typeof ProfileReviewPanel>> = {},
) {
  const props = {
    review,
    reviewedAt,
    reviewing: false,
    saving: false,
    error: null,
    onReview: vi.fn(),
    onApply: vi.fn(() => true),
    ...overrides,
  }

  render(<ProfileReviewPanel {...props} />)
  return props
}

describe('ProfileReviewPanel', () => {
  it('invites the first review', async () => {
    const user = userEvent.setup()
    const props = renderPanel({ review: null, reviewedAt: null })

    expect(screen.getByText(/job-agnostic feedback/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Review profile' }))

    expect(props.onReview).toHaveBeenCalledOnce()
  })

  it('shows a status while reviewing', () => {
    renderPanel({ review: null, reviewedAt: null, reviewing: true })

    expect(screen.getByRole('status')).toHaveTextContent('Reviewing your profile...')
    expect(screen.getByRole('button', { name: 'Review profile' })).toBeDisabled()
  })

  it('announces completed suggestions through the status region', () => {
    renderPanel()

    expect(screen.getByRole('status')).toHaveTextContent(
      'Review complete. Suggestions ready.',
    )
  })

  it('shows review errors inside the panel', () => {
    renderPanel({ error: 'OpenAI is unavailable.' })

    expect(screen.getByRole('alert')).toHaveTextContent('OpenAI is unavailable.')
  })

  it('groups suggestions and reports the count', () => {
    renderPanel()

    expect(screen.getByText(/3 suggestions/)).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Summary' })).getByText('Add a summary'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Experience' })).getByText(
        'Quantify impact',
      ),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Skills' })).getByText(
        'Group related skills',
      ),
    ).toBeInTheDocument()
  })

  it('shows an empty state when there are no suggestions', () => {
    renderPanel({ review: { suggestions: [] } })

    expect(screen.getByText('No suggestions right now.')).toBeInTheDocument()
  })

  it('applies a proposal and marks it applied', async () => {
    const user = userEvent.setup()
    const props = renderPanel()
    const apply = screen.getByRole('button', {
      name: 'Apply suggestion: Add a summary',
    })

    await user.click(apply)

    expect(props.onApply).toHaveBeenCalledWith(review.suggestions[0])
    expect(apply).toHaveAttribute('aria-disabled', 'true')
    expect(apply).toHaveAccessibleName('Applied suggestion: Add a summary')
    expect(apply).toHaveTextContent('Applied')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Applied suggestion: Add a summary',
    )
  })

  it('explains when a suggestion no longer matches the form', async () => {
    const user = userEvent.setup()
    renderPanel({ onApply: vi.fn(() => false) })

    await user.click(
      screen.getByRole('button', { name: 'Apply suggestion: Add a summary' }),
    )

    expect(
      screen.getByText(
        'This suggestion no longer matches the form. Run the review again.',
      ),
    ).toBeInTheDocument()
  })

  it('offers no Apply button for advisory suggestions', () => {
    renderPanel()

    const skills = screen.getByRole('region', { name: 'Skills' })
    expect(within(skills).queryByRole('button')).not.toBeInTheDocument()
  })

  it('blocks Apply while the profile is saving', async () => {
    const user = userEvent.setup()
    const props = renderPanel({ saving: true })

    const apply = screen.getByRole('button', {
      name: 'Apply suggestion: Add a summary',
    })
    expect(apply).toHaveAttribute('aria-disabled', 'true')

    await user.click(apply)
    expect(props.onApply).not.toHaveBeenCalled()
  })
})
