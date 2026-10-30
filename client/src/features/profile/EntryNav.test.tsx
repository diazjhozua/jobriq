import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EntryNav } from './EntryNav'

const items = [
  {
    id: 'profile-experience-entry-1',
    entryId: 'entry-1',
    label: '1 · Acme — Engineer',
  },
  { id: 'profile-experience-entry-2', entryId: 'entry-2', label: 'Experience 2' },
]

describe('EntryNav', () => {
  it('renders nothing without entries', () => {
    const { container } = render(<EntryNav ariaLabel="Work experience entries" items={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('links to each entry and marks the first as current', () => {
    render(
      <>
        <EntryNav ariaLabel="Work experience entries" items={items} />
        <div id="profile-experience-entry-1" />
        <div id="profile-experience-entry-2" />
      </>,
    )

    const nav = screen.getByRole('navigation', {
      name: 'Work experience entries',
    })
    const links = screen.getAllByRole('link')

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#profile-experience-entry-1',
      '#profile-experience-entry-2',
    ])
    expect(links[0]).toHaveAttribute('aria-current', 'location')
    expect(links[1]).not.toHaveAttribute('aria-current')
    expect(links[0]).toHaveAttribute('title', '1 · Acme — Engineer')
    expect(nav).toBeInTheDocument()
  })
})
