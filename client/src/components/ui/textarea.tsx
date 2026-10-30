import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'
import { useFieldControl } from './field-context'

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  const field = useFieldControl()

  return (
    <textarea
      aria-describedby={props['aria-describedby'] ?? field?.describedBy}
      aria-invalid={props['aria-invalid'] ?? (field?.invalid ? true : undefined)}
      className={cn(
        'min-h-24 w-full resize-y rounded-sm border border-border bg-surface px-3 py-2 text-[0.9rem] leading-6 text-body transition-colors placeholder:text-muted/70 hover:border-muted/50',
        className,
      )}
      {...props}
    />
  )
}
