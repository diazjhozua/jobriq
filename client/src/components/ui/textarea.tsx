import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { useFieldControl } from './field-context'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const field = useFieldControl()

  return (
    <textarea
      aria-describedby={props['aria-describedby'] ?? field?.describedBy}
      aria-invalid={props['aria-invalid'] ?? (field?.invalid ? true : undefined)}
      className={cn(
        'min-h-24 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-body placeholder:text-muted',
        className,
      )}
      {...props}
    />
  )
}
