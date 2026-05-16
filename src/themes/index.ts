import fs from 'fs'
import path from 'path'
import { theme as classic } from './classic.js'
import { theme as modern } from './modern.js'
import { theme as minimal } from './minimal.js'
import { theme as executive } from './executive.js'
import { theme as harvard } from './harvard.js'
import type { ResumeTheme } from '../types/theme.js'

export { classic, modern, minimal, executive, harvard }

export const BUILTIN_THEMES: Record<string, ResumeTheme> = {
  classic,
  modern,
  minimal,
  executive,
  harvard,
}

export function getTheme(name: string = 'classic', cwd: string): ResumeTheme {
  if (name in BUILTIN_THEMES) return BUILTIN_THEMES[name]

  const customPath = path.join(cwd, 'themes', `${name}.json`)
  if (!fs.existsSync(customPath)) {
    const builtin = Object.keys(BUILTIN_THEMES).join(', ')
    const hasCustomDir = fs.existsSync(path.join(cwd, 'themes'))
    const customHint = hasCustomDir
      ? `Custom: no themes/${name}.json found`
      : `Custom: themes/ directory not found in ${cwd}`
    throw new Error(`Theme "${name}" not found.\n  Built-in: ${builtin}\n  ${customHint}`)
  }

  let raw: unknown
  try {
    raw = JSON.parse(fs.readFileSync(customPath, 'utf-8'))
  } catch {
    throw new Error(`Failed to parse themes/${name}.json — check for syntax errors`)
  }

  return deepMerge(classic, { ...(raw as object), name }) as ResumeTheme
}

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const result = { ...base }
  for (const key of Object.keys(override)) {
    const baseVal = base[key]
    const overVal = override[key]
    if (
      overVal !== null &&
      typeof overVal === 'object' &&
      !Array.isArray(overVal) &&
      typeof baseVal === 'object' &&
      baseVal !== null &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(baseVal as Record<string, unknown>, overVal as Record<string, unknown>)
    } else {
      result[key] = overVal
    }
  }
  return result
}
