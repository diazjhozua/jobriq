import { Plus, X } from 'lucide-react'
import { useEffect, useRef, type ClipboardEvent } from 'react'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { cn } from '../../lib/utils'

interface BulletListFieldProps {
  id: string
  itemLabel: string
  value: string[]
  onChange: (bullets: string[]) => void
  onBlur?: () => void
  error?: string
  className?: string
  rows?: number
}

export function BulletListField({
  id,
  itemLabel,
  value,
  onChange,
  onBlur,
  error,
  className,
  rows = 2,
}: BulletListFieldProps) {
  const hintId = `${id}-hint`
  const errorId = error ? `${id}-error` : undefined
  const textareas = useRef<Array<HTMLTextAreaElement | null>>([])
  const addButton = useRef<HTMLButtonElement>(null)
  const pendingFocus = useRef<number | null>(null)

  useEffect(() => {
    if (pendingFocus.current === null) {
      return
    }

    const index = pendingFocus.current
    pendingFocus.current = null
    const target = textareas.current[index] ?? addButton.current
    target?.focus()
  }, [value.length])

  const update = (index: number, text: string) => {
    const next = [...value]
    next[index] = text
    onChange(next)
  }

  const remove = (index: number) => {
    if (value.length === 1) {
      onChange([''])
      return
    }

    pendingFocus.current = Math.max(0, index - 1)
    onChange(value.filter((_, current) => current !== index))
  }

  const append = () => {
    pendingFocus.current = value.length
    onChange([...value, ''])
  }

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>, index: number) => {
    const text = event.clipboardData.getData('text')
    if (!text.includes('\n')) {
      return
    }

    const parts = text
      .split('\n')
      .map((part) => part.replace(/^\s*[-*•]\s*/, '').trim())
      .filter(Boolean)

    if (parts.length === 0) {
      return
    }

    event.preventDefault()
    const next = [...value]
    next.splice(index, 1, ...parts)
    onChange(next)
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <p className="text-[0.78rem] font-medium tracking-[0.01em] text-navy">Bullets</p>
      <p id={hintId} className="text-[0.75rem] leading-5 text-muted">
        One achievement per line. Paste a list to split it into bullets.
      </p>

      <ul aria-label={`${itemLabel} bullets`} className="mt-1 space-y-2">
        {value.map((bullet, index) => (
          <li key={index} className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-muted"
            />
            <Textarea
              ref={(element) => {
                textareas.current[index] = element
              }}
              aria-label={`${itemLabel} bullet ${index + 1}`}
              aria-describedby={[hintId, errorId].filter(Boolean).join(' ')}
              aria-invalid={error ? true : undefined}
              rows={rows}
              value={bullet}
              onChange={(event) => update(index, event.target.value)}
              onBlur={onBlur}
              onPaste={(event) => handlePaste(event, index)}
              className="min-h-0 flex-1 resize-y"
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${itemLabel} bullet ${index + 1}`}
              onClick={() => remove(index)}
            >
              <X aria-hidden="true" size={16} />
            </Button>
          </li>
        ))}
      </ul>

      <div>
        <Button ref={addButton} variant="outline" size="sm" onClick={append}>
          <Plus aria-hidden="true" size={16} />
          Add bullet
        </Button>
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-[0.75rem] font-medium text-accent">
          {error}
        </p>
      ) : null}
    </div>
  )
}
