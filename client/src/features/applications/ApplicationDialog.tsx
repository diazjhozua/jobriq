import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import {
  applicationFormSchema,
  type ApplicationFormValues,
} from '../../lib/schemas'
import { APPLICATION_STATUSES, STATUS_LABELS } from '../../lib/types'
import { useJobriq } from '../../providers/JobriqProvider'

interface ApplicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApplicationDialog({ open, onOpenChange }: ApplicationDialogProps) {
  const { addApplication } = useJobriq()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      company: '',
      role: '',
      jobDescription: '',
      status: 'saved',
    },
  })

  const close = (next: boolean) => {
    if (!next) {
      reset()
      setError(null)
    }

    onOpenChange(next)
  }

  const onSubmit = async (values: ApplicationFormValues) => {
    setError(null)

    try {
      await addApplication(values)
      reset()
      onOpenChange(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The application could not be added.')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="Add application"
      description="Track a role and generate a resume tailored to its description."
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
          <Field label="Company" htmlFor="application-company" error={errors.company?.message}>
            <Input id="application-company" {...register('company')} />
          </Field>
          <Field label="Role" htmlFor="application-role" error={errors.role?.message}>
            <Input id="application-role" {...register('role')} />
          </Field>
        </div>

        <Field label="Status" htmlFor="application-status" error={errors.status?.message}>
          <Select id="application-status" {...register('status')}>
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Job description"
          htmlFor="application-description"
          error={errors.jobDescription?.message}
          hint="Paste the posting so AI can match keywords and tailor bullets."
        >
          <Textarea
            id="application-description"
            rows={7}
            {...register('jobDescription')}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => close(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 aria-hidden="true" size={16} className="animate-spin" />
            ) : null}
            Add application
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
