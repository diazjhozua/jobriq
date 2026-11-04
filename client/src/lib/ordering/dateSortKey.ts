import { parseMonthYear } from '../monthYear'

export type DateSortKey =
  | { kind: 'dated'; ordinal: number; precision: 'month' | 'year' }
  | { kind: 'present' }
  | { kind: 'unparseable'; reason: 'empty' | 'legacy'; raw: string }

/**
 * Turns a stored month-year display string into a comparable key.
 * Months rank by `year * 12 + (month - 1)`; a year-only value is treated as
 * January of that year; `Present` is newest; empty and legacy free text are
 * unparseable and sort last.
 */
export function toDateSortKey(value: string): DateSortKey {
  const parsed = parseMonthYear(value)

  switch (parsed.kind) {
    case 'month':
      return {
        kind: 'dated',
        ordinal: parsed.year * 12 + parsed.month - 1,
        precision: 'month',
      }
    case 'year':
      return { kind: 'dated', ordinal: parsed.year * 12, precision: 'year' }
    case 'present':
      return { kind: 'present' }
    case 'legacy':
      return { kind: 'unparseable', reason: 'legacy', raw: parsed.raw }
    default:
      return { kind: 'unparseable', reason: 'empty', raw: '' }
  }
}

function rank(key: DateSortKey): number {
  switch (key.kind) {
    case 'present':
      return 2
    case 'dated':
      return 1
    default:
      return 0
  }
}

/**
 * Descending order: Present, then dated values newest first (a month outranks
 * a year-only value on the same ordinal), then unparseable values.
 */
export function compareDateSortKeysDesc(
  left: DateSortKey,
  right: DateSortKey,
): number {
  const leftRank = rank(left)
  const rightRank = rank(right)

  if (leftRank !== rightRank) {
    return rightRank - leftRank
  }

  if (left.kind === 'dated' && right.kind === 'dated') {
    if (left.ordinal !== right.ordinal) {
      return right.ordinal - left.ordinal
    }

    if (left.precision !== right.precision) {
      return left.precision === 'month' ? -1 : 1
    }
  }

  return 0
}
