import { X } from 'lucide-react'
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Field } from '../../components/ui/field'
import { useFieldControl } from '../../components/ui/field-context'
import { mergeSkills, parseSkills } from '../../lib/utils'

interface TagListFieldProps {
  id: string
  label: string
  inputLabel?: string
  hint: string
  tags: string[]
  error?: string
  className?: string
  placeholder?: string
  removeLabel: (tag: string) => string
  onChange: (tags: string[]) => void
  onDraftChange?: (draft: string) => void
  onBlur?: () => void
}

export function TagListField({
  id,
  label,
  inputLabel,
  hint,
  tags,
  error,
  className,
  placeholder,
  removeLabel,
  onChange,
  onDraftChange,
  onBlur,
}: TagListFieldProps) {
  const [draft, setDraft] = useState('')
  const field = useFieldControl()
  const inputRef = useRef<HTMLInputElement>(null)

  const updateDraft = (next: string) => {
    setDraft(next)
    onDraftChange?.(next)
  }

  const add = (raw: string) => {
    if (parseSkills(raw).length === 0) {
      return
    }

    onChange(mergeSkills(tags, raw))
    updateDraft('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      add(draft)
      return
    }

    if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  const remove = (tag: string) => {
    onChange(tags.filter((current) => current !== tag))
    inputRef.current?.focus()
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text')
    if (!/[,\n]/.test(text)) {
      return
    }

    event.preventDefault()
    add(draft ? `${draft},${text}` : text)
  }

  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} className={className}>
      <div className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-sm border border-border bg-surface px-2 py-1.5 transition-colors focus-within:border-muted/60 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-blue">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex min-w-0 max-w-full items-center gap-1 border border-border bg-canvas px-2 py-0.5 text-[0.78rem] text-body"
          >
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">{tag}</span>
            <button
              type="button"
              aria-label={removeLabel(tag)}
              onClick={() => remove(tag)}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-muted transition-colors hover:text-navy"
            >
              <X aria-hidden="true" size={14} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={draft}
          onChange={(event) => updateDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            add(draft)
            onBlur?.()
          }}
          onPaste={handlePaste}
          aria-label={inputLabel}
          aria-describedby={field?.describedBy}
          aria-invalid={field?.invalid ? true : undefined}
          placeholder={tags.length === 0 ? placeholder : undefined}
          className="h-8 min-w-[8rem] flex-1 bg-transparent px-1 text-[0.9rem] text-body placeholder:text-muted/70 focus-visible:outline-none"
        />
      </div>
    </Field>
  )
}
