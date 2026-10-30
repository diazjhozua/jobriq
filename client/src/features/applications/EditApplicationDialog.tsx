import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { MonthYearField } from '../../components/ui/month-year-field'
import { formatMonthYearValue } from '../../lib/monthYear'
import {
  applicationDetailsSchema,
  type ApplicationDetailsValues,
} from '../../lib/schemas'
import type { JobApplication } from '../../lib/types'
import { useJobriq } from '../../providers/JobriqProvider'

interface EditApplicationDialogProps {
  application: JobApplication | null
  onOpenChange: (open: boolean) => void
}

export function EditApplicationDialog({
  application,
  onOpenChange,
}: EditApplicationDialogProps) {
  const { updateApplication } = useJobriq()
  const [error, setError] = useState<string | null>(null)
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationDetailsValues>({
    resolver: zodResolver(applicationDetailsSchema),
    defaultValues: {
      company: application?.company ?? '',
      role: application?.role ?? '',
      appliedDate: application
        ? formatMonthYearValue(application.appliedDate)
        : '',
    },
  })

  const close = (next: boolean) => {
    if (!next) {
      setError(null)
    }

    onOpenChange(next)
  }

  const onSubmit = async (values: ApplicationDetailsValues) => {
    if (!application) {
      return
    }

    setError(null)

    try {
      await updateApplication(application.id, values)
      onOpenChange(false)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The application could not be updated.',
      )
    }
  }

  return (
    <Dialog
      open={application !== null}
      onOpenChange={close}
      title="Edit application"
      description="Update the company, role, and the month you applied."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {error ? (
          <div
            role="alert"
            className="border-l-2 border-accent bg-canvas px-3 py-2 text-[0.85rem] leading-6 text-body"
          >
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Company"
            htmlFor="edit-application-company"
            error={errors.company?.message}
          >
            <Input id="edit-application-company" {...register('company')} />
          </Field>
          <Field
            label="Role"
            htmlFor="edit-application-role"
            error={errors.role?.message}
          >
            <Input id="edit-application-role" {...register('role')} />
          </Field>
        </div>

        <MonthYearField
          control={control}
          name="appliedDate"
          id="edit-application-applied-date"
          label="Date applied (optional)"
          pickerLabel="Date applied"
          error={errors.appliedDate?.message}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => close(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 aria-hidden="true" size={16} className="animate-spin" />
            ) : null}
            Save changes
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
