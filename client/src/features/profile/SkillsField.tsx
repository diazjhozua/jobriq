import { X } from 'lucide-react'
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Field } from '../../components/ui/field'
import { useFieldControl } from '../../components/ui/field-context'
import { parseSkills } from '../../lib/utils'

interface SkillsFieldProps {
  id: string
  skills: string[]
  error?: string
  onChange: (skills: string[]) => void
  onDraftChange?: (draft: string) => void
}

interface SkillsEditorProps {
  id: string
  skills: string[]
  onChange: (skills: string[]) => void
  onDraftChange?: (draft: string) => void
}

function SkillsEditor({ id, skills, onChange, onDraftChange }: SkillsEditorProps) {
  const [draft, setDraft] = useState('')
  const field = useFieldControl()
  const inputRef = useRef<HTMLInputElement>(null)

  const updateDraft = (next: string) => {
    setDraft(next)
    onDraftChange?.(next)
  }

  const add = (raw: string) => {
    const parsed = parseSkills(raw)
    if (parsed.length === 0) {
      return
    }

    const merged = [...skills]
    for (const skill of parsed) {
      if (!merged.some((existing) => existing.toLowerCase() === skill.toLowerCase())) {
        merged.push(skill)
      }
    }

    onChange(merged)
    updateDraft('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      add(draft)
      return
    }

    if (event.key === 'Backspace' && draft === '' && skills.length > 0) {
      onChange(skills.slice(0, -1))
    }
  }

  const remove = (skill: string) => {
    onChange(skills.filter((current) => current !== skill))
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
    <div className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-sm border border-border bg-surface px-2 py-1.5 transition-colors focus-within:border-muted/60 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-blue">
      {skills.map((skill) => (
        <span
          key={skill}
          className="inline-flex min-w-0 max-w-full items-center gap-1 border border-border bg-canvas px-2 py-0.5 text-[0.78rem] text-body"
        >
          <span className="min-w-0 break-words [overflow-wrap:anywhere]">{skill}</span>
          <button
            type="button"
            aria-label={`Remove skill ${skill}`}
            onClick={() => remove(skill)}
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
        onBlur={() => add(draft)}
        onPaste={handlePaste}
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid ? true : undefined}
        placeholder={skills.length === 0 ? 'TypeScript, React, .NET' : undefined}
        className="h-8 min-w-[8rem] flex-1 bg-transparent px-1 text-[0.9rem] text-body placeholder:text-muted/70 focus-visible:outline-none"
      />
    </div>
  )
}

export function SkillsField({
  id,
  skills,
  error,
  onChange,
  onDraftChange,
}: SkillsFieldProps) {
  return (
    <Field
      label="Skills"
      htmlFor={id}
      error={error}
      hint="Press Enter or comma to add a skill. Backspace removes the last one."
    >
      <SkillsEditor
        id={id}
        skills={skills}
        onChange={onChange}
        onDraftChange={onDraftChange}
      />
    </Field>
  )
}
