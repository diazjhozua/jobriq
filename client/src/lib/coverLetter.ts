import type { CoverLetter } from './types'

export function formatCoverLetterDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatCoverLetterText(letter: CoverLetter): string {
  return [
    letter.salutation,
    '',
    ...letter.paragraphs.flatMap((paragraph) => [paragraph, '']),
    letter.closing,
    letter.signature,
  ]
    .join('\n')
    .trim()
}
