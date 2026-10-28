import { createContext, useContext } from 'react'

export interface FieldControlContextValue {
  describedBy?: string
  invalid: boolean
}

export const FieldControlContext = createContext<FieldControlContextValue | null>(null)

export function useFieldControl() {
  return useContext(FieldControlContext)
}
