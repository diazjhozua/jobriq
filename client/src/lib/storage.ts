import { createEmptyState } from './defaults'
import { apiStateSchema } from './schemas'
import type { JobriqState } from './types'

export const STORAGE_KEY = 'jobriq.v1'

export function loadState(): JobriqState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return createEmptyState()
    }

    const parsed = apiStateSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : createEmptyState()
  } catch {
    return createEmptyState()
  }
}

export function saveState(state: JobriqState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
