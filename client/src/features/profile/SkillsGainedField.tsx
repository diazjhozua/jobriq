import { TagListField } from './TagListField'

interface SkillsGainedFieldProps {
  id: string
  itemLabel: string
  value: string[]
  onChange: (skills: string[]) => void
  onBlur?: () => void
  error?: string
  className?: string
}

export function SkillsGainedField({
  id,
  itemLabel,
  value,
  onChange,
  onBlur,
  error,
  className,
}: SkillsGainedFieldProps) {
  return (
    <TagListField
      id={id}
      label="Skills gained"
      inputLabel={`${itemLabel} skills gained`}
      hint="Press Enter or comma to add. Skills from this entry you may want in your overall Skills list."
      tags={value}
      error={error}
      className={className}
      placeholder="Docker, GraphQL"
      removeLabel={(skill) => `Remove ${skill} from ${itemLabel}`}
      onChange={onChange}
      onBlur={onBlur}
    />
  )
}
