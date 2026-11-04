import { useController, type Control } from 'react-hook-form'
import { Combobox } from '../../components/ui/combobox'
import { Field } from '../../components/ui/field'
import type { Profile } from '../../lib/types'

export type ProfileSuggestionPath =
  | `projects.${number}.associatedWith`
  | `awards.${number}.associatedWith`
  | `awards.${number}.issuer`
  | `certifications.${number}.issuingOrganization`

interface ProfileComboboxFieldProps {
  control: Control<Profile>
  name: ProfileSuggestionPath
  id: string
  label: string
  options: readonly string[]
  hint?: string
  placeholder?: string
  allowClear?: boolean
  className?: string
}

export function ProfileComboboxField({
  control,
  name,
  id,
  label,
  options,
  hint,
  placeholder,
  allowClear,
  className,
}: ProfileComboboxFieldProps) {
  const { field, fieldState } = useController({ control, name })
  const value = typeof field.value === 'string' ? field.value : ''

  return (
    <Field
      label={label}
      htmlFor={id}
      error={fieldState.error?.message}
      hint={hint}
      className={className}
    >
      <Combobox
        id={id}
        label={label}
        value={value}
        options={options}
        onChange={field.onChange}
        onBlur={field.onBlur}
        placeholder={placeholder}
        allowClear={allowClear}
      />
    </Field>
  )
}
