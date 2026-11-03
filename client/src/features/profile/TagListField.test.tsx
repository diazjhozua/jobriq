import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { TagListField } from './TagListField'

function Harness({ initial = [] }: { initial?: string[] }) {
  const [tags, setTags] = useState(initial)

  return (
    <TagListField
      id="tags"
      label="Tags"
      hint="Press Enter or comma to add."
      tags={tags}
      onChange={setTags}
      removeLabel={(tag) => `Remove ${tag}`}
    />
  )
}

describe('TagListField', () => {
  it('adds tags on Enter and comma without duplicates', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const input = screen.getByRole('textbox', { name: 'Tags' })
    await user.type(input, 'React{Enter}Vue,vue{Enter}')

    expect(screen.getByRole('button', { name: 'Remove React' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Vue' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(2)
  })

  it('removes the last tag on Backspace when the draft is empty', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['React', 'Vue']} />)

    await user.type(screen.getByRole('textbox', { name: 'Tags' }), '{Backspace}')

    expect(screen.queryByRole('button', { name: 'Remove Vue' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove React' })).toBeInTheDocument()
  })

  it('commits the draft on blur', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Harness />
        <button type="button">Outside</button>
      </>,
    )

    await user.type(screen.getByRole('textbox', { name: 'Tags' }), 'Svelte')
    await user.click(screen.getByRole('button', { name: 'Outside' }))

    expect(
      screen.getByRole('button', { name: 'Remove Svelte' }),
    ).toBeInTheDocument()
  })
})
