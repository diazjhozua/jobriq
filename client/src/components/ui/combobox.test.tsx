import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Combobox } from './combobox'

interface HarnessProps {
  options?: readonly string[]
  initial?: string
  allowClear?: boolean
  onChange?: (value: string) => void
}

function Harness({
  options = ['Acme', 'Globex', 'State University'],
  initial = '',
  allowClear = false,
  onChange,
}: HarnessProps) {
  const [value, setValue] = useState(initial)

  return (
    <Combobox
      id="organization"
      label="Organization"
      value={value}
      options={options}
      allowClear={allowClear}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    />
  )
}

describe('Combobox', () => {
  it('opens on click and lists every option', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const input = screen.getByRole('combobox')
    expect(input).toHaveAttribute('aria-expanded', 'false')

    await user.click(input)

    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('filters options as the user types', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('combobox'), 'sta')

    expect(screen.getByRole('option', { name: 'State University' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Acme' })).not.toBeInTheDocument()
  })

  it('selects an option on click and closes the list', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Globex' }))

    expect(onChange).toHaveBeenLastCalledWith('Globex')
    expect(screen.getByRole('combobox')).toHaveValue('Globex')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('selects the active option with the keyboard', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenLastCalledWith('Globex')
  })

  it('closes on Escape without changing the value', async () => {
    const user = userEvent.setup()
    render(<Harness initial="Acme" />)

    const input = screen.getByRole('combobox')
    await user.click(input)
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(input).toHaveValue('Acme')
  })

  it('keeps custom text that matches no option', async () => {
    const user = userEvent.setup()
    render(<Harness options={[]} />)

    await user.type(screen.getByRole('combobox'), 'Custom Org')

    expect(screen.getByRole('combobox')).toHaveValue('Custom Org')
    expect(
      screen.getByText('No suggestions. Free text is allowed.'),
    ).toBeInTheDocument()
  })

  it('clears the value when allowClear is set', async () => {
    const user = userEvent.setup()
    render(<Harness initial="Acme" allowClear />)

    await user.click(screen.getByRole('button', { name: 'Clear Organization' }))

    expect(screen.getByRole('combobox')).toHaveValue('')
  })

  it('stays open when the input is clicked again', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.click(input)

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('closes when focus moves outside the field', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Harness />
        <button type="button">Outside</button>
      </>,
    )

    await user.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Outside' }))

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('exposes the active option through aria-activedescendant', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.keyboard('{ArrowDown}')

    const listbox = screen.getByRole('listbox')
    expect(input).toHaveAttribute('aria-controls', listbox.id)
    expect(input.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Globex' }).id,
    )
  })
})
