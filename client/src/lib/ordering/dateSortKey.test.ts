import { describe, expect, it } from 'vitest'
import { compareDateSortKeysDesc, toDateSortKey } from './dateSortKey'

describe('toDateSortKey', () => {
  it('maps every month format to the same ordinal', () => {
    const expected = { kind: 'dated', ordinal: 2022 * 12 + 7, precision: 'month' }

    expect(toDateSortKey('Aug 2022')).toEqual(expected)
    expect(toDateSortKey('August 2022')).toEqual(expected)
    expect(toDateSortKey('2022-08')).toEqual(expected)
    expect(toDateSortKey('2022-08-01')).toEqual(expected)
    expect(toDateSortKey('8/2022')).toEqual(expected)
  })

  it('treats a year-only value as January of that year', () => {
    expect(toDateSortKey('2018')).toEqual({
      kind: 'dated',
      ordinal: 2018 * 12,
      precision: 'year',
    })
  })

  it('keeps Present as its own newest kind', () => {
    expect(toDateSortKey('Present')).toEqual({ kind: 'present' })
  })

  it('marks empty and legacy values as unparseable', () => {
    expect(toDateSortKey('')).toEqual({
      kind: 'unparseable',
      reason: 'empty',
      raw: '',
    })
    expect(toDateSortKey('Spring 2020')).toEqual({
      kind: 'unparseable',
      reason: 'legacy',
      raw: 'Spring 2020',
    })
    expect(toDateSortKey('2022-13')).toEqual({
      kind: 'unparseable',
      reason: 'legacy',
      raw: '2022-13',
    })
  })
})

describe('compareDateSortKeysDesc', () => {
  const key = toDateSortKey

  it('orders Present above every dated value', () => {
    expect(compareDateSortKeysDesc(key('Present'), key('Jan 2026'))).toBeLessThan(0)
    expect(compareDateSortKeysDesc(key('Jan 2026'), key('Present'))).toBeGreaterThan(0)
  })

  it('orders dated values newest first', () => {
    expect(compareDateSortKeysDesc(key('Aug 2022'), key('Jul 2022'))).toBeLessThan(0)
    expect(compareDateSortKeysDesc(key('Jul 2022'), key('Aug 2022'))).toBeGreaterThan(0)
  })

  it('ranks a month above a year-only value with the same ordinal', () => {
    expect(compareDateSortKeysDesc(key('Jan 2018'), key('2018'))).toBeLessThan(0)
    expect(compareDateSortKeysDesc(key('2018'), key('Jan 2018'))).toBeGreaterThan(0)
    expect(compareDateSortKeysDesc(key('2018'), key('Dec 2017'))).toBeLessThan(0)
  })

  it('puts unparseable values last and treats them as equal', () => {
    expect(compareDateSortKeysDesc(key('Dec 2017'), key('Spring 2020'))).toBeLessThan(0)
    expect(compareDateSortKeysDesc(key('Spring 2020'), key(''))).toBe(0)
  })

  it('returns 0 for equal values', () => {
    expect(compareDateSortKeysDesc(key('Aug 2022'), key('8/2022'))).toBe(0)
    expect(compareDateSortKeysDesc(key('Present'), key('Present'))).toBe(0)
  })
})
