import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { MonthYearPicker } from './month-year-picker'

interface HarnessProps {
  initialValue?: string
  allowPresent?: boolean
}

function Harness({ initialValue = '', allowPresent }: HarnessProps) {
  const [value, setValue] = useState(initialValue)

  return (
    <>
      <MonthYearPicker
        id="start"
        label="Start date"
        value={value}
        onChange={setValue}
        allowPresent={allowPresent}
      />
      <p data-testid="value">{value}</p>
    </>
  )
}

describe('MonthYearPicker', () => {
  it('shows a placeholder until a month and year are picked', () => {
    render(<Harness />)

    expect(
      screen.getByRole('button', { name: 'Select month and year' }),
    ).toBeInTheDocument()
  })

  it('selects a month and emits the display value', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Select month and year' }))
    await user.selectOptions(screen.getByLabelText('Start date year'), '2022')
    await user.click(screen.getByRole('button', { name: 'August 2022' }))

    expect(screen.getByTestId('value')).toHaveTextContent('Aug 2022')
    expect(screen.getByRole('button', { name: 'Aug 2022' })).toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: 'Start date picker' }),
    ).not.toBeInTheDocument()
  })

  it('offers Present only for end dates', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Harness initialValue="Aug 2022" />)

    await user.click(screen.getByRole('button', { name: 'Aug 2022' }))
    expect(
      screen.queryByRole('button', { name: 'Present' }),
    ).not.toBeInTheDocument()

    await user.keyboard('{Escape}')
    rerender(<Harness initialValue="Aug 2022" allowPresent />)

    await user.click(screen.getByRole('button', { name: 'Aug 2022' }))
    await user.click(screen.getByRole('button', { name: 'Present' }))

    expect(screen.getByTestId('value')).toHaveTextContent('Present')
  })

  it('clears the value', async () => {
    const user = userEvent.setup()
    render(<Harness initialValue="Aug 2022" />)

    await user.click(screen.getByRole('button', { name: 'Aug 2022' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))

    expect(screen.getByTestId('value')).toBeEmptyDOMElement()
  })

  it('displays a legacy value and leaves it untouched when dismissed', async () => {
    const user = userEvent.setup()
    render(<Harness initialValue="Spring 2020" />)

    await user.click(screen.getByRole('button', { name: 'Spring 2020' }))
    await user.keyboard('{Escape}')

    expect(screen.getByTestId('value')).toHaveTextContent('Spring 2020')
  })
})
