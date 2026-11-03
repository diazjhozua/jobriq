import { TagListField } from './TagListField'

interface SkillsFieldProps {
  id: string
  skills: string[]
  error?: string
  onChange: (skills: string[]) => void
  onDraftChange?: (draft: string) => void
}

export function SkillsField({
  id,
  skills,
  error,
  onChange,
  onDraftChange,
}: SkillsFieldProps) {
  return (
    <TagListField
      id={id}
      label="Skills"
      hint="Press Enter or comma to add a skill. Backspace removes the last one."
      tags={skills}
      error={error}
      placeholder="TypeScript, React, .NET"
      removeLabel={(skill) => `Remove skill ${skill}`}
      onChange={onChange}
      onDraftChange={onDraftChange}
    />
  )
}
