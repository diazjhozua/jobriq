import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { useFieldControl } from './field-context'

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const field = useFieldControl()

  return (
    <select
      aria-describedby={props['aria-describedby'] ?? field?.describedBy}
      aria-invalid={props['aria-invalid'] ?? (field?.invalid ? true : undefined)}
      className={cn(
        'h-10 w-full rounded-sm border border-border bg-surface px-3 text-[0.9rem] text-body transition-colors hover:border-muted/50',
        className,
      )}
      {...props}
    />
  )
}
