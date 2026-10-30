import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Textarea } from './textarea'

function measure(element: HTMLTextAreaElement, scrollHeight: number) {
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    value: scrollHeight,
  })
  Object.defineProperty(element, 'offsetHeight', {
    configurable: true,
    value: 50,
  })
  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    value: 48,
  })
}

describe('Textarea', () => {
  it('grows to the content height while typing', () => {
    const { getByRole } = render(
      <Textarea aria-label="Notes" autoGrow value="" onChange={() => {}} />,
    )
    const textarea = getByRole('textbox') as HTMLTextAreaElement
    measure(textarea, 120)

    fireEvent.input(textarea, { target: { value: 'First line' } })

    expect(textarea.style.height).toBe('122px')
    expect(textarea).toHaveClass('resize-none')
  })

  it('leaves the height alone without autoGrow', () => {
    const { getByRole } = render(<Textarea aria-label="Notes" />)
    const textarea = getByRole('textbox') as HTMLTextAreaElement
    measure(textarea, 120)

    fireEvent.input(textarea, { target: { value: 'First line' } })

    expect(textarea.style.height).toBe('')
  })

  it('forwards refs to the element', () => {
    let element: HTMLTextAreaElement | null = null

    render(
      <Textarea
        aria-label="Notes"
        ref={(node) => {
          element = node
        }}
      />,
    )

    expect(element).toBeInstanceOf(HTMLTextAreaElement)
  })
})
