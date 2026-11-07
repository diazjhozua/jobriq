import {
  compareDateSortKeysDesc,
  toDateSortKey,
  type EmptyDatePolicy,
} from './dateSortKey'

/** One date field in an entry's ordering, with the meaning of an empty value. */
export interface OrderingDateField<T> {
  readonly read: (entry: T) => string
  readonly empty: EmptyDatePolicy
}

/** A section's total ordering: field precedence plus the undated gate. */
export interface SectionOrderingPolicy<T extends { id: string }> {
  readonly fields: readonly OrderingDateField<T>[]
  readonly hasUsableDate: (entry: T) => boolean
}

function hasUsableDateValue(value: string): boolean {
  return toDateSortKey(value).kind !== 'unparseable'
}

/** Ranges rank by end date (an empty end is ongoing), then by start date. */
export function rangeOrderingPolicy<T extends { id: string }>(
  startDate: (entry: T) => string,
  endDate: (entry: T) => string,
): SectionOrderingPolicy<T> {
  return {
    fields: [
      { read: endDate, empty: 'ongoing' },
      { read: startDate, empty: 'unparseable' },
    ],
    hasUsableDate: (entry) =>
      hasUsableDateValue(startDate(entry)) || hasUsableDateValue(endDate(entry)),
  }
}

/** Sections with one meaningful date rank by it; an empty value is undated. */
export function singleDateOrderingPolicy<T extends { id: string }>(
  read: (entry: T) => string,
): SectionOrderingPolicy<T> {
  return {
    fields: [{ read, empty: 'unparseable' }],
    hasUsableDate: (entry) => hasUsableDateValue(read(entry)),
  }
}

/**
 * Compares two entries by a section policy. Entries without any usable date
 * sort last as a stable group; the remaining entries compare field by field,
 * newest first. A field where both values are unparseable falls through to the
 * next field, so a legacy end date still uses the start date as its tie-break.
 */
export function compareByPolicy<T extends { id: string }>(
  policy: SectionOrderingPolicy<T>,
  left: T,
  right: T,
): number {
  const leftDated = policy.hasUsableDate(left)
  const rightDated = policy.hasUsableDate(right)

  if (leftDated !== rightDated) {
    return leftDated ? -1 : 1
  }

  if (!leftDated) {
    return 0
  }

  for (const field of policy.fields) {
    const leftKey = toDateSortKey(field.read(left), field.empty)
    const rightKey = toDateSortKey(field.read(right), field.empty)
    const comparison = compareDateSortKeysDesc(leftKey, rightKey)

    if (comparison !== 0) {
      return comparison
    }
  }

  return 0
}

/** Stable sort that preserves the original order of equal entries. */
export function sortStableBy<T>(
  entries: readonly T[],
  compare: (left: T, right: T) => number,
): T[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => compare(left.entry, right.entry) || left.index - right.index)
    .map(({ entry }) => entry)
}

export function sortByPolicy<T extends { id: string }>(
  entries: readonly T[],
  policy: SectionOrderingPolicy<T>,
): T[] {
  return sortStableBy(entries, (left, right) => compareByPolicy(policy, left, right))
}
