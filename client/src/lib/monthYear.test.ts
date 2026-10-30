import { describe, expect, it } from 'vitest'
import {
  formatDateRange,
  formatMonthYear,
  formatMonthYearValue,
  formatProjectMeta,
  monthYearToIso,
  parseMonthYear,
  yearOptions,
} from './monthYear'

describe('parseMonthYear', () => {
  it('parses canonical and readable month values', () => {
    expect(parseMonthYear('Aug 2022')).toEqual({
      kind: 'month',
      year: 2022,
      month: 8,
    })
    expect(parseMonthYear('August 2022')).toEqual({
      kind: 'month',
      year: 2022,
      month: 8,
    })
    expect(parseMonthYear('aug 2022')).toEqual({
      kind: 'month',
      year: 2022,
      month: 8,
    })
    expect(parseMonthYear('2022-08')).toEqual({
      kind: 'month',
      year: 2022,
      month: 8,
    })
    expect(parseMonthYear('2022-08-01')).toEqual({
      kind: 'month',
      year: 2022,
      month: 8,
    })
    expect(parseMonthYear('8/2022')).toEqual({
      kind: 'month',
      year: 2022,
      month: 8,
    })
  })

  it('recognizes present, year-only, empty, and legacy values', () => {
    expect(parseMonthYear('Present')).toEqual({ kind: 'present' })
    expect(parseMonthYear('2018')).toEqual({ kind: 'year', year: 2018 })
    expect(parseMonthYear('  ')).toEqual({ kind: 'empty' })
    expect(parseMonthYear('Spring 2020')).toEqual({
      kind: 'legacy',
      raw: 'Spring 2020',
    })
    expect(parseMonthYear('2022-13')).toEqual({
      kind: 'legacy',
      raw: '2022-13',
    })
    expect(parseMonthYear('13/2022')).toEqual({
      kind: 'legacy',
      raw: '13/2022',
    })
    expect(parseMonthYear('2022-13-01')).toEqual({
      kind: 'legacy',
      raw: '2022-13-01',
    })
  })
})

describe('formatMonthYear', () => {
  it('formats a month and year with a short English month name', () => {
    expect(formatMonthYear(2022, 8)).toBe('Aug 2022')
    expect(formatMonthYear(2023, 1)).toBe('Jan 2023')
    expect(formatMonthYear(2023, 13)).toBe('')
  })

  it('formats stored values for display without rewriting legacy text', () => {
    expect(formatMonthYearValue('2022-08')).toBe('Aug 2022')
    expect(formatMonthYearValue('present')).toBe('Present')
    expect(formatMonthYearValue('2018')).toBe('2018')
    expect(formatMonthYearValue('Spring 2020')).toBe('Spring 2020')
    expect(formatMonthYearValue('')).toBe('')
  })
})

describe('month and year conversion', () => {
  it('converts display values to an ISO first-of-month date', () => {
    expect(monthYearToIso('Aug 2022')).toBe('2022-08-01')
    expect(monthYearToIso('Present')).toBeNull()
    expect(monthYearToIso('2018')).toBeNull()
    expect(monthYearToIso('Spring 2020')).toBeNull()
  })

  it('formats an ISO date as a display value', () => {
    expect(formatMonthYearValue('2022-08-01')).toBe('Aug 2022')
  })
})

describe('ranges and project metadata', () => {
  it('joins both sides of a range', () => {
    expect(formatDateRange('Aug 2022', 'Present')).toBe('Aug 2022 – Present')
    expect(formatDateRange('Aug 2022', '')).toBe('Aug 2022')
    expect(formatDateRange('', '2023')).toBe('2023')
    expect(formatDateRange('', '')).toBe('')
  })

  it('joins dates and association with a middle dot', () => {
    expect(formatProjectMeta('Aug 2022', 'Present', 'Acme')).toBe(
      'Aug 2022 – Present · Acme',
    )
    expect(formatProjectMeta('', '', 'Acme')).toBe('Acme')
    expect(formatProjectMeta('', '', '  ')).toBe('')
  })
})

describe('yearOptions', () => {
  it('lists years newest first and keeps an out-of-range selection', () => {
    const years = yearOptions(1900, 2020, 2022)

    expect(years[0]).toBe(2022)
    expect(years[years.length - 1]).toBe(1900)
  })
})
