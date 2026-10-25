import { zodResolver } from '@hookform/resolvers/zod'
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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
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
    }

    onOpenChange(next)
  }

  const onSubmit = (values: ApplicationFormValues) => {
    addApplication(values)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="Add application"
      description="Track a role and generate a resume tailored to its description."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Add application
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
