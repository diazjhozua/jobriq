import { describe, expect, it } from 'vitest'
import { formatCoverLetterDate, formatCoverLetterText } from './coverLetter'
import type { CoverLetter } from './types'

const letter: CoverLetter = {
  personal: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-0100',
    location: 'Remote',
    linkedin: '',
    github: '',
    website: '',
  },
  company: 'Acme',
  role: 'Engineer',
  salutation: 'Dear Acme Hiring Team,',
  paragraphs: ['First paragraph.', 'Second paragraph.'],
  closing: 'Sincerely,',
  signature: 'Jane Doe',
  generatedAt: '2026-10-29T12:00:00.000Z',
}

describe('formatCoverLetterText', () => {
  it('copies the body from the salutation through the signature', () => {
    const text = formatCoverLetterText(letter)

    expect(text.startsWith('Dear Acme Hiring Team,')).toBe(true)
    expect(text.endsWith('Sincerely,\nJane Doe')).toBe(true)
    expect(text).toContain('First paragraph.\n\nSecond paragraph.')
  })

  it('leaves the letterhead and date out of the copied text', () => {
    const text = formatCoverLetterText(letter)

    expect(text).not.toContain('jane@example.com')
    expect(text).not.toContain('555-0100')
    expect(text).not.toContain('October')
  })
})

describe('formatCoverLetterDate', () => {
  it('formats a generated timestamp', () => {
    expect(formatCoverLetterDate(letter.generatedAt)).toContain('2026')
  })

  it('returns an empty string for an invalid timestamp', () => {
    expect(formatCoverLetterDate('not a date')).toBe('')
  })
})
