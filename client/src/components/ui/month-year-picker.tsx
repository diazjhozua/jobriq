import * as Popover from '@radix-ui/react-popover'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import {
  currentYear,
  formatMonthYear,
  formatMonthYearValue,
  LONG_MONTHS,
  parseMonthYear,
  SHORT_MONTHS,
  yearOptions,
} from '../../lib/monthYear'
import { cn } from '../../lib/utils'
import { useFieldControl } from './field-context'

interface MonthYearPickerProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  allowPresent?: boolean
  allowClear?: boolean
  placeholder?: string
  minYear?: number
  maxYear?: number
  disabled?: boolean
  className?: string
}

export function MonthYearPicker({
  id,
  label,
  value,
  onChange,
  onBlur,
  allowPresent = false,
  allowClear = true,
  placeholder = 'Select month and year',
  minYear = 1950,
  maxYear,
  disabled,
  className,
}: MonthYearPickerProps) {
  const field = useFieldControl()
  const [open, setOpen] = useState(false)
  const parsed = parseMonthYear(value)
  const selectedYear =
    parsed.kind === 'month' || parsed.kind === 'year' ? parsed.year : undefined
  const [viewYear, setViewYear] = useState(
    () => selectedYear ?? currentYear(),
  )
  const display = formatMonthYearValue(value)
  const lastYear = maxYear ?? currentYear() + 1

  const close = () => {
    setOpen(false)
    onBlur?.()
  }

  const commit = (next: string) => {
    onChange(next)
    close()
  }

  const selectedMonth =
    parsed.kind === 'month' && parsed.year === viewYear ? parsed.month : null
  const years = yearOptions(selectedYear, minYear, lastYear)
  if (!years.includes(viewYear)) {
    years.push(viewYear)
    years.sort((left, right) => right - left)
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setViewYear(selectedYear ?? currentYear())
          setOpen(true)
        } else {
          close()
        }
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-describedby={field?.describedBy}
          aria-invalid={field?.invalid ? true : undefined}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-sm border border-border bg-surface px-3 text-left text-[0.9rem] text-body transition-colors hover:border-muted/50 disabled:cursor-not-allowed disabled:opacity-60',
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarDays aria-hidden="true" size={15} className="shrink-0 text-muted" />
            <span className={cn('truncate', display ? undefined : 'text-muted')}>
              {display || placeholder}
            </span>
          </span>
          <ChevronDown aria-hidden="true" size={15} className="shrink-0 text-muted" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          role="group"
          aria-label={`${label} picker`}
          className="z-50 w-64 border border-border bg-surface p-3"
        >
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              aria-label={`Previous year for ${label}`}
              className="flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors hover:text-navy"
              onClick={() => setViewYear((year) => year - 1)}
            >
              ‹
            </button>
            <select
              aria-label={`${label} year`}
              value={viewYear}
              onChange={(event) => setViewYear(Number(event.target.value))}
              className="h-8 rounded-sm border border-border bg-surface px-2 text-[0.85rem] tabular-nums text-body"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label={`Next year for ${label}`}
              className="flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors hover:text-navy"
              onClick={() => setViewYear((year) => year + 1)}
            >
              ›
            </button>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {SHORT_MONTHS.map((month, index) => (
              <button
                key={month}
                type="button"
                aria-label={`${LONG_MONTHS[index]} ${viewYear}`}
                aria-pressed={selectedMonth === index + 1}
                className={cn(
                  'h-8 rounded-sm border text-[0.8rem] transition-colors',
                  selectedMonth === index + 1
                    ? 'border-primary bg-canvas font-medium text-navy'
                    : 'border-transparent text-muted hover:border-border hover:text-navy',
                )}
                onClick={() => commit(formatMonthYear(viewYear, index + 1))}
              >
                {month}
              </button>
            ))}
          </div>
          {allowPresent || allowClear ? (
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2">
              {allowPresent ? (
                <button
                  type="button"
                  className="text-[0.8rem] text-muted transition-colors hover:text-navy"
                  onClick={() => commit('Present')}
                >
                  Present
                </button>
              ) : (
                <span />
              )}
              {allowClear ? (
                <button
                  type="button"
                  className="text-[0.8rem] text-muted transition-colors hover:text-navy"
                  onClick={() => commit('')}
                >
                  Clear
                </button>
              ) : null}
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
