import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProfileSaveBar } from './ProfileSaveBar'

describe('ProfileSaveBar', () => {
  it('renders nothing when the profile is clean', () => {
    render(<ProfileSaveBar dirty={false} saved={false} submitting={false} />)

    expect(
      screen.queryByRole('region', { name: 'Profile save' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Save profile' }),
    ).not.toBeInTheDocument()
  })

  it('offers an enabled save while there are unsaved changes', () => {
    render(<ProfileSaveBar dirty saved={false} submitting={false} />)

    expect(
      screen.getByRole('region', { name: 'Profile save' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeEnabled()
  })

  it('confirms a save and disables the button', () => {
    render(<ProfileSaveBar dirty={false} saved submitting={false} />)

    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled()
  })

  it('announces a save in progress', () => {
    render(<ProfileSaveBar dirty saved={false} submitting />)

    expect(screen.getByText('Saving…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled()
  })

  it('drops a stale confirmation when new edits arrive', () => {
    render(<ProfileSaveBar dirty saved submitting={false} />)

    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeEnabled()
  })
})
