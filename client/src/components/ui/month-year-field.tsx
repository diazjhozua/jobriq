import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form'
import { Field } from './field'
import { MonthYearPicker } from './month-year-picker'

interface MonthYearFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  id: string
  label: string
  pickerLabel: string
  error?: string
  allowPresent?: boolean
  className?: string
}

export function MonthYearField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  pickerLabel,
  error,
  allowPresent,
  className,
}: MonthYearFieldProps<T>) {
  return (
    <Field label={label} htmlFor={id} error={error} className={className}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <MonthYearPicker
            id={id}
            label={pickerLabel}
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            allowPresent={allowPresent}
          />
        )}
      />
    </Field>
  )
}
