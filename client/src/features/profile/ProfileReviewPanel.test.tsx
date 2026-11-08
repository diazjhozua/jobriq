import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { ProfileReview, ReviewSuggestion } from '../../lib/types'
import { ProfileReviewPanel } from './ProfileReviewPanel'

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
    reviewing: false,
    saving: false,
    applied: new Set<string>(),
    staleId: null,
    onApply: vi.fn(),
    ...overrides,
  }

  render(<ProfileReviewPanel {...props} />)
  return props
}

describe('ProfileReviewPanel', () => {
  it('groups suggestions by section', () => {
    renderPanel()

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

  it('invites a review when none exists yet', () => {
    renderPanel({ review: null })

    expect(
      screen.getByText('No review yet. Run Review profile to get suggestions.'),
    ).toBeInTheDocument()
  })

  it('applies a proposal', async () => {
    const user = userEvent.setup()
    const props = renderPanel()

    await user.click(
      screen.getByRole('button', { name: 'Apply suggestion: Add a summary' }),
    )

    expect(props.onApply).toHaveBeenCalledWith(review.suggestions[0])
  })

  it('marks an applied suggestion and disables it', () => {
    renderPanel({ applied: new Set(['summary-1']) })

    const apply = screen.getByRole('button', {
      name: 'Applied suggestion: Add a summary',
    })
    expect(apply).toHaveAttribute('aria-disabled', 'true')
    expect(apply).toHaveTextContent('Applied')
  })

  it('explains when a suggestion no longer matches the form', () => {
    renderPanel({ staleId: 'summary-1' })

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

  it('blocks Apply while a review is running', async () => {
    const user = userEvent.setup()
    const props = renderPanel({ reviewing: true })

    const apply = screen.getByRole('button', {
      name: 'Apply suggestion: Add a summary',
    })
    expect(apply).toHaveAttribute('aria-disabled', 'true')

    await user.click(apply)
    expect(props.onApply).not.toHaveBeenCalled()
  })
})
