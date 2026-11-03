import { describe, expect, it } from 'vitest'
import { mergeSkills, uniqueSkills } from './utils'

describe('uniqueSkills', () => {
  it('trims, drops blanks, and dedupes case-insensitively', () => {
    expect(uniqueSkills([' React ', 'react', '', '  ', 'Vue'])).toEqual([
      'React',
      'Vue',
    ])
  })

  it('keeps the first casing and order', () => {
    expect(uniqueSkills(['TypeScript', 'typescript', 'React'])).toEqual([
      'TypeScript',
      'React',
    ])
  })
})

describe('mergeSkills', () => {
  it('parses comma and newline input and merges without duplicates', () => {
    expect(mergeSkills(['React'], 'Vue, react\nSvelte')).toEqual([
      'React',
      'Vue',
      'Svelte',
    ])
  })

  it('returns the existing list when the input is blank', () => {
    expect(mergeSkills(['React'], ' , \n ')).toEqual(['React'])
  })
})
