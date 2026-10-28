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
        'h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-body',
        className,
      )}
      {...props}
    />
  )
}
