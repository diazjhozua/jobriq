import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { useFieldControl } from './field-context'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const field = useFieldControl()

  return (
    <input
      aria-describedby={props['aria-describedby'] ?? field?.describedBy}
      aria-invalid={props['aria-invalid'] ?? (field?.invalid ? true : undefined)}
      className={cn(
        'h-10 w-full rounded-sm border border-border bg-surface px-3 text-[0.9rem] text-body transition-colors placeholder:text-muted/70 hover:border-muted/50 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
