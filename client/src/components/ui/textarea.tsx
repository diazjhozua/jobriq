import {
  useCallback,
  useLayoutEffect,
  useRef,
  type ComponentProps,
} from 'react'
import { cn } from '../../lib/utils'
import { useFieldControl } from './field-context'

interface TextareaProps extends ComponentProps<'textarea'> {
  autoGrow?: boolean
}

function resizeTextarea(element: HTMLTextAreaElement) {
  if (element.scrollHeight <= 0) {
    return
  }

  const borders = element.offsetHeight - element.clientHeight
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight + borders}px`
}

export function Textarea({
  className,
  autoGrow = false,
  onInput,
  ref,
  value,
  ...props
}: TextareaProps) {
  const element = useRef<HTMLTextAreaElement | null>(null)
  const field = useFieldControl()

  const setRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      element.current = node

      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref],
  )

  useLayoutEffect(() => {
    if (autoGrow && element.current) {
      resizeTextarea(element.current)
    }
  }, [autoGrow, value])

  useLayoutEffect(() => {
    if (!autoGrow) {
      return
    }

    const handleResize = () => {
      if (element.current) {
        resizeTextarea(element.current)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [autoGrow])

  return (
    <textarea
      {...props}
      ref={setRef}
      value={value}
      aria-describedby={props['aria-describedby'] ?? field?.describedBy}
      aria-invalid={props['aria-invalid'] ?? (field?.invalid ? true : undefined)}
      onInput={(event) => {
        if (autoGrow) {
          resizeTextarea(event.currentTarget)
        }

        onInput?.(event)
      }}
      className={cn(
        'min-h-24 w-full resize-y rounded-sm border border-border bg-surface px-3 py-2 text-[0.9rem] leading-6 text-body transition-colors placeholder:text-muted/70 hover:border-muted/50',
        autoGrow && 'resize-none overflow-hidden',
        className,
      )}
    />
  )
}
