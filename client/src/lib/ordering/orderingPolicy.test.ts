import { describe, expect, it } from 'vitest'
import {
  compareByPolicy,
  rangeOrderingPolicy,
  singleDateOrderingPolicy,
  sortByPolicy,
  type SectionOrderingPolicy,
} from './orderingPolicy'

interface Entry {
  id: string
  startDate: string
  endDate: string
  issueDate?: string
}

function entry(
  id: string,
  startDate: string,
  endDate: string,
  issueDate = '',
): Entry {
  return { id, startDate, endDate, issueDate }
}

const range = rangeOrderingPolicy<Entry>(
  (item) => item.startDate,
  (item) => item.endDate,
)

const single = singleDateOrderingPolicy<Entry>((item) => item.issueDate ?? '')

function ordered(entries: readonly Entry[], policy: SectionOrderingPolicy<Entry>) {
  return sortByPolicy(entries, policy).map((item) => item.id)
}

describe('rangeOrderingPolicy', () => {
  it('orders fields end date first, then start date', () => {
    expect(range.fields).toHaveLength(2)
    expect(range.fields[0]).toMatchObject({ empty: 'ongoing' })
    expect(range.fields[1]).toMatchObject({ empty: 'unparseable' })
    expect(range.fields[0].read(entry('a', 'Jan 2020', 'Aug 2021'))).toBe(
      'Aug 2021',
    )
    expect(range.fields[1].read(entry('a', 'Jan 2020', 'Aug 2021'))).toBe(
      'Jan 2020',
    )
  })

  it('treats an entry as dated when either date parses', () => {
    expect(range.hasUsableDate(entry('a', 'Jan 2020', ''))).toBe(true)
    expect(range.hasUsableDate(entry('a', '', 'Jan 2020'))).toBe(true)
    expect(range.hasUsableDate(entry('a', 'Present', ''))).toBe(true)
    expect(range.hasUsableDate(entry('a', '', ''))).toBe(false)
    expect(range.hasUsableDate(entry('a', 'Spring 2020', ''))).toBe(false)
    expect(range.hasUsableDate(entry('a', 'Spring 2020', 'Jan 2020'))).toBe(true)
  })

  it('orders by end date before start date', () => {
    const entries = [
      entry('newer-start-older-end', 'Aug 2022', 'Jan 2023'),
      entry('older-start-newer-end', 'Jan 2018', 'Jun 2024'),
    ]

    expect(ordered(entries, range)).toEqual([
      'older-start-newer-end',
      'newer-start-older-end',
    ])
  })

  it('ranks an empty end date like Present, above every dated end', () => {
    const entries = [
      entry('ended', 'Jan 2019', 'Jan 2021'),
      entry('ongoing-empty', 'Jan 2015', ''),
      entry('ongoing-present', 'Jan 2016', 'Present'),
      entry('newest-ended', 'Jan 2015', 'Jun 2024'),
    ]

    expect(ordered(entries, range)).toEqual([
      'ongoing-present',
      'ongoing-empty',
      'newest-ended',
      'ended',
    ])
  })

  it('breaks equal end dates with the start date, newest first', () => {
    const entries = [
      entry('older-start', 'Jan 2015', 'Jan 2021'),
      entry('newer-start', 'Aug 2022', 'Jan 2021'),
    ]

    expect(ordered(entries, range)).toEqual(['newer-start', 'older-start'])
  })

  it('breaks two empty end dates with the start date', () => {
    const entries = [
      entry('older-start', 'Jan 2015', ''),
      entry('newer-start', 'Aug 2022', ''),
    ]

    expect(ordered(entries, range)).toEqual(['newer-start', 'older-start'])
  })

  it('places entries without any usable date last and keeps them stable', () => {
    const entries = [
      entry('legacy', 'Spring 2020', ''),
      entry('dated', 'Aug 2022', ''),
      entry('empty', '', ''),
      entry('legacy-two', 'Fall 2019', ''),
    ]

    expect(ordered(entries, range)).toEqual([
      'dated',
      'legacy',
      'empty',
      'legacy-two',
    ])
  })

  it('falls back to the start date when both end dates are legacy', () => {
    const entries = [
      entry('older-start', 'Jan 2015', 'Spring 2020'),
      entry('newer-start', 'Aug 2022', 'Fall 2020'),
    ]

    expect(ordered(entries, range)).toEqual(['newer-start', 'older-start'])
  })

  it('ranks a year-only end below a month end in the same year', () => {
    const entries = [
      entry('year-only', 'Jan 2010', '2018'),
      entry('august', 'Jan 2010', 'Aug 2018'),
    ]

    expect(ordered(entries, range)).toEqual(['august', 'year-only'])
  })

  it('keeps entries with equal dates in their original order', () => {
    const entries = [
      entry('first', 'Jan 2020', 'Jan 2021'),
      entry('second', 'Jan 2020', 'Jan 2021'),
    ]

    expect(ordered(entries, range)).toEqual(['first', 'second'])
  })

  it('does not mutate the input', () => {
    const entries = [entry('old', 'Jan 2018', ''), entry('new', 'Aug 2022', '')]
    sortByPolicy(entries, range)

    expect(entries.map((item) => item.id)).toEqual(['old', 'new'])
  })
})

describe('singleDateOrderingPolicy', () => {
  it('uses one field and treats an empty date as undated', () => {
    expect(single.fields).toHaveLength(1)
    expect(single.fields[0].empty).toBe('unparseable')
    expect(single.hasUsableDate(entry('a', '', '', ''))).toBe(false)
    expect(single.hasUsableDate(entry('a', '', '', 'Jun 2023'))).toBe(true)
  })

  it('orders by the single date and puts undated entries last', () => {
    const entries = [
      entry('old', '', '', 'Jan 2019'),
      entry('new', '', '', 'Jun 2023'),
      entry('undated', '', '', ''),
    ]

    expect(ordered(entries, single)).toEqual(['new', 'old', 'undated'])
  })
})

describe('compareByPolicy', () => {
  it('returns 0 for entries without a usable date', () => {
    expect(
      compareByPolicy(range, entry('a', 'Spring 2020', ''), entry('b', '', '')),
    ).toBe(0)
  })

  it('ranks a dated entry above an undated entry', () => {
    expect(
      compareByPolicy(range, entry('dated', 'Aug 2022', ''), entry('none', '', '')),
    ).toBeLessThan(0)
  })
})
