export const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export const LONG_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export type ParsedMonthYear =
  | { kind: 'empty' }
  | { kind: 'present' }
  | { kind: 'month'; year: number; month: number }
  | { kind: 'year'; year: number }
  | { kind: 'legacy'; raw: string }

function monthNumber(name: string): number | null {
  const normalized = name.toLowerCase().replace(/\.$/, '').slice(0, 3)
  const index = SHORT_MONTHS.findIndex((month) => month.toLowerCase() === normalized)

  return index === -1 ? null : index + 1
}

function validMonth(year: number, month: number, raw: string): ParsedMonthYear {
  return month >= 1 && month <= 12
    ? { kind: 'month', year, month }
    : { kind: 'legacy', raw }
}

export function parseMonthYear(value: string): ParsedMonthYear {
  const trimmed = value.trim()

  if (!trimmed) {
    return { kind: 'empty' }
  }

  if (trimmed.toLowerCase() === 'present') {
    return { kind: 'present' }
  }

  const iso = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/.exec(trimmed)
  if (iso) {
    return validMonth(Number(iso[1]), Number(iso[2]), trimmed)
  }

  const numeric = /^(\d{1,2})\/(\d{4})$/.exec(trimmed)
  if (numeric) {
    return validMonth(Number(numeric[2]), Number(numeric[1]), trimmed)
  }

  const named = /^([A-Za-z]{3,9})\.?\s+(\d{4})$/.exec(trimmed)
  if (named) {
    const month = monthNumber(named[1])

    return month === null
      ? { kind: 'legacy', raw: trimmed }
      : { kind: 'month', year: Number(named[2]), month }
  }

  const yearOnly = /^(\d{4})$/.exec(trimmed)
  if (yearOnly) {
    return { kind: 'year', year: Number(yearOnly[1]) }
  }

  return { kind: 'legacy', raw: trimmed }
}

export function formatMonthYear(year: number, month: number): string {
  const label = SHORT_MONTHS[month - 1]

  return label ? `${label} ${year}` : ''
}

export function formatMonthYearValue(value: string): string {
  const parsed = parseMonthYear(value)

  switch (parsed.kind) {
    case 'month':
      return formatMonthYear(parsed.year, parsed.month)
    case 'present':
      return 'Present'
    case 'year':
      return String(parsed.year)
    case 'legacy':
      return parsed.raw
    default:
      return ''
  }
}

export function monthYearToIso(value: string): string | null {
  const parsed = parseMonthYear(value)

  if (parsed.kind !== 'month') {
    return null
  }

  return `${parsed.year}-${String(parsed.month).padStart(2, '0')}-01`
}

export function formatDateRange(start: string, end: string): string {
  const left = formatMonthYearValue(start)
  const right = formatMonthYearValue(end)

  if (left && right) {
    return `${left} – ${right}`
  }

  return left || right
}

export function formatProjectMeta(
  startDate: string,
  endDate: string,
  associatedWith: string,
): string {
  return [formatDateRange(startDate, endDate), associatedWith.trim()]
    .filter(Boolean)
    .join(' · ')
}

export function currentYear(): number {
  return new Date().getFullYear()
}

export function yearOptions(
  selectedYear: number | undefined,
  minYear = 1950,
  maxYear = currentYear() + 1,
): number[] {
  const years: number[] = []

  for (let year = maxYear; year >= minYear; year -= 1) {
    years.push(year)
  }

  if (selectedYear !== undefined && !years.includes(selectedYear)) {
    years.push(selectedYear)
    years.sort((left, right) => right - left)
  }

  return years
}
