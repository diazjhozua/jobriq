import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import {
  promptStyleFormSchema,
  type PromptStyleFormValues,
} from '../../lib/schemas'
import type { PromptStyle } from '../../lib/types'
import { useJobriq } from '../../providers/JobriqProvider'

interface PromptStyleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  style: PromptStyle | null
}

export function PromptStyleDialog({
  open,
  onOpenChange,
  style,
}: PromptStyleDialogProps) {
  const { createPromptStyle, updatePromptStyle } = useJobriq()
  const [error, setError] = useState<string | null>(null)
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PromptStyleFormValues>({
    resolver: zodResolver(promptStyleFormSchema),
    defaultValues: {
      name: style?.name ?? '',
      instructions: style?.instructions ?? '',
    },
  })

  const close = (next: boolean) => {
    if (!next) {
      setError(null)
    }

    onOpenChange(next)
  }

  const onSubmit = async (values: PromptStyleFormValues) => {
    setError(null)

    try {
      if (style) {
        await updatePromptStyle(style.id, values)
      } else {
        await createPromptStyle(values)
      }

      onOpenChange(false)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The prompt style could not be saved.',
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={style ? 'Edit prompt style' : 'New prompt style'}
      description="Describe how Jobriq should sound when it writes. Jobriq always keeps your facts and its own formatting intact."
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

        <Field
          label="Name"
          htmlFor="prompt-style-name"
          error={errors.name?.message}
          hint="A short label, such as “Warm and direct”."
        >
          <Input id="prompt-style-name" {...register('name')} />
        </Field>

        <Field
          label="Instructions"
          htmlFor="prompt-style-instructions"
          error={errors.instructions?.message}
          hint="Voice, tone, and phrasing. Jobriq keeps your facts and its own formatting intact."
        >
          <Controller
            control={control}
            name="instructions"
            render={({ field }) => (
              <Textarea
                id="prompt-style-instructions"
                rows={8}
                autoGrow
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </Field>

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
            {style ? 'Save changes' : 'Create prompt style'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
