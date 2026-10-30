import { useMemo } from 'react'
import { useController, useWatch, type Control } from 'react-hook-form'
import { Field } from '../../components/ui/field'
import { Select } from '../../components/ui/select'
import type { Profile, WorkExperience } from '../../lib/types'

const PERSONAL_PROJECT = 'Personal Project'

function companyOptions(experience: readonly WorkExperience[]): string[] {
  const seen = new Set<string>()
  const options: string[] = []

  for (const entry of experience) {
    const company = entry.company.trim()
    const key = company.toLowerCase()

    if (company && !seen.has(key)) {
      seen.add(key)
      options.push(company)
    }
  }

  return options
}

interface AssociatedWithFieldProps {
  control: Control<Profile>
  index: number
  id: string
}

export function AssociatedWithField({
  control,
  index,
  id,
}: AssociatedWithFieldProps) {
  const experience = useWatch({ control, name: 'experience' })
  const companies = useMemo(
    () => companyOptions(experience ?? []),
    [experience],
  )
  const { field, fieldState } = useController({
    control,
    name: `projects.${index}.associatedWith`,
  })
  const value = field.value ?? ''
  const normalized = value.trim().toLowerCase()
  const stale =
    normalized !== '' &&
    normalized !== PERSONAL_PROJECT.toLowerCase() &&
    !companies.some((company) => company.toLowerCase() === normalized)

  return (
    <Field
      label="Associated with (optional)"
      htmlFor={id}
      error={fieldState.error?.message}
      hint="Link this project to a company in your experience, or mark it as personal."
    >
      <Select
        id={id}
        value={value}
        onChange={(event) => field.onChange(event.target.value)}
        onBlur={field.onBlur}
      >
        <option value="">None</option>
        {companies.map((company) => (
          <option key={company} value={company}>
            {company}
          </option>
        ))}
        <option value={PERSONAL_PROJECT}>{PERSONAL_PROJECT}</option>
        {stale ? (
          <option value={value}>{value} (not in your experience)</option>
        ) : null}
      </Select>
    </Field>
  )
}
