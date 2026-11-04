import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseSkills(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
}

export function uniqueStrings(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const unique: string[] = []

  for (const value of values) {
    const trimmed = value.trim()
    const key = trimmed.toLowerCase()
    if (!trimmed || seen.has(key)) {
      continue
    }

    seen.add(key)
    unique.push(trimmed)
  }

  return unique
}

export function uniqueSkills(skills: readonly string[]): string[] {
  return uniqueStrings(skills)
}

export function mergeSkills(existing: readonly string[], raw: string): string[] {
  return uniqueSkills([...existing, ...parseSkills(raw)])
}

export function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}
