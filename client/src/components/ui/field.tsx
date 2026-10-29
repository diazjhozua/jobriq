import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { FieldControlContext } from './field-context'
import { Label } from './label'

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}

export function Field({ label, htmlFor, error, hint, className, children }: FieldProps) {
  const hintId = hint && !error ? `${htmlFor}-hint` : undefined
  const errorId = error ? `${htmlFor}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <FieldControlContext.Provider value={{ describedBy, invalid: Boolean(error) }}>
        {children}
      </FieldControlContext.Provider>
      {hintId ? (
        <p id={hintId} className="text-[0.75rem] leading-5 text-muted">
          {hint}
        </p>
      ) : null}
      {errorId ? (
        <p id={errorId} role="alert" className="text-[0.75rem] font-medium text-accent">
          {error}
        </p>
      ) : null}
    </div>
  )
}
