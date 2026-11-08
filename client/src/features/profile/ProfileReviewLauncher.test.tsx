import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { ProfileReview, ReviewSuggestion } from '../../lib/types'
import { ProfileReviewLauncher } from './ProfileReviewLauncher'

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

type LauncherProps = ComponentProps<typeof ProfileReviewLauncher>

function launcherProps(overrides: Partial<LauncherProps> = {}): LauncherProps {
  return {
    review,
    reviewedAt,
    reviewing: false,
    saving: false,
    error: null,
    saveBarVisible: false,
    open: true,
    onOpenChange: vi.fn(),
    onReview: vi.fn(),
    onApply: vi.fn(() => true),
    ...overrides,
  }
}

function renderLauncher(overrides: Partial<LauncherProps> = {}) {
  const props = launcherProps(overrides)

  render(<ProfileReviewLauncher {...props} />)
  return props
}

function LauncherHarness({
  initialOpen = true,
  onOpenChange,
  ...props
}: Omit<LauncherProps, 'open' | 'onOpenChange'> & {
  initialOpen?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [open, setOpen] = useState(initialOpen)

  return (
    <ProfileReviewLauncher
      {...props}
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        onOpenChange?.(next)
      }}
    />
  )
}

describe('ProfileReviewLauncher', () => {
  it('starts a review from the floating action and opens the dialog', async () => {
    const user = userEvent.setup()
    const onReview = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <LauncherHarness
        {...launcherProps({ review: null, reviewedAt: null })}
        initialOpen={false}
        onReview={onReview}
        onOpenChange={onOpenChange}
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Review profile' }))

    expect(onReview).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('reports the suggestion count on the floating action', () => {
    renderLauncher({ open: false })

    expect(
      screen.getByRole('button', { name: 'Review suggestions (3)' }),
    ).toBeInTheDocument()
  })

  it('shows a reviewing action and announces progress', () => {
    renderLauncher({ review: null, reviewedAt: null, reviewing: true })

    expect(
      screen.getByRole('button', { name: 'Reviewing…', hidden: true }),
    ).toBeEnabled()
    expect(screen.getByRole('status')).toHaveTextContent('Reviewing your profile...')
  })

  it('shows review errors inside the dialog', () => {
    renderLauncher({ error: 'OpenAI is unavailable.' })

    expect(screen.getByRole('alert')).toHaveTextContent('OpenAI is unavailable.')
  })

  it('announces a failed re-review instead of a stale completion', () => {
    renderLauncher({ error: 'OpenAI is unavailable.' })

    expect(screen.getByRole('status')).toHaveTextContent('Review failed.')
  })

  it('marks an applied suggestion and announces it', async () => {
    const user = userEvent.setup()
    const props = renderLauncher()
    const apply = screen.getByRole('button', {
      name: 'Apply suggestion: Add a summary',
    })

    await user.click(apply)

    expect(props.onApply).toHaveBeenCalledWith(review.suggestions[0])
    expect(apply).toHaveAttribute('aria-disabled', 'true')
    expect(apply).toHaveAccessibleName('Applied suggestion: Add a summary')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Applied suggestion: Add a summary',
    )
  })

  it('explains when a suggestion no longer matches the form', async () => {
    const user = userEvent.setup()
    renderLauncher({ onApply: vi.fn(() => false) })

    await user.click(
      screen.getByRole('button', { name: 'Apply suggestion: Add a summary' }),
    )

    expect(
      screen.getByText(
        'This suggestion no longer matches the form. Run the review again.',
      ),
    ).toBeInTheDocument()
  })

  it('lifts above the save bar when it is visible', () => {
    renderLauncher({ open: false, saveBarVisible: true })

    expect(
      screen.getByRole('region', { name: 'Profile review controls' }),
    ).toHaveClass('bottom-32')
  })

  it('moves focus into the review panel when the dialog opens', async () => {
    const user = userEvent.setup()

    render(
      <LauncherHarness
        {...launcherProps({ review: null, reviewedAt: null })}
        initialOpen={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Review profile' }))

    await waitFor(() =>
      expect(document.getElementById('profile-review')).toHaveFocus(),
    )
  })

  it('closes on Escape and returns focus to the floating action', async () => {
    const user = userEvent.setup()

    render(<LauncherHarness {...launcherProps()} />)

    const apply = screen.getByRole('button', {
      name: 'Apply suggestion: Add a summary',
    })
    apply.focus()
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() =>
      expect(document.getElementById('profile-review-action')).toHaveFocus(),
    )
  })

  it('offers a review action when opened without a review', () => {
    renderLauncher({ review: null, reviewedAt: null })

    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByRole('button', { name: 'Review profile' }),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        'No review yet. Run Review profile to get suggestions.',
      ),
    ).toBeInTheDocument()
  })
})
