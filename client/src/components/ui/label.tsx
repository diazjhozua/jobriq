import type { LabelHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'text-[0.78rem] font-medium tracking-[0.01em] text-navy',
        className,
      )}
      {...props}
    />
  )
}
