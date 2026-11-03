import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { RESUME_THEME_FONTS } from '../../lib/defaults'
import {
  resumeThemeFormSchema,
  type ResumeThemeFormValues,
} from '../../lib/schemas'
import type { ResumeTheme, ResumeThemeStyles } from '../../lib/types'
import { useJobriq } from '../../providers/JobriqProvider'
import { ResumeThemePreview } from './ResumeThemePreview'

interface ResumeThemeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  theme: ResumeTheme | null
  baseStyles: ResumeThemeStyles
}

const hexPattern = /^#?[0-9A-Fa-f]{6}$/

function colorValue(value: string | undefined, fallback: string): string {
  if (!value || !hexPattern.test(value.trim())) {
    return fallback
  }

  return value.trim().startsWith('#') ? value.trim() : `#${value.trim()}`
}

function sizeValue(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function previewStyles(
  values: Partial<ResumeThemeFormValues>,
  fallback: ResumeThemeStyles,
): ResumeThemeStyles {
  return {
    nameFont: values.nameFont || fallback.nameFont,
    bodyFont: values.bodyFont || fallback.bodyFont,
    textColor: colorValue(values.textColor, fallback.textColor),
    mutedColor: colorValue(values.mutedColor, fallback.mutedColor),
    headingColor: colorValue(values.headingColor, fallback.headingColor),
    ruleColor: colorValue(values.ruleColor, fallback.ruleColor),
    bodySize: sizeValue(values.bodySize, fallback.bodySize),
    smallSize: sizeValue(values.smallSize, fallback.smallSize),
    headingSize: sizeValue(values.headingSize, fallback.headingSize),
    nameSize: sizeValue(values.nameSize, fallback.nameSize),
    pageMargin: sizeValue(values.pageMargin, fallback.pageMargin),
    showRules: values.showRules ?? fallback.showRules,
  }
}

interface ColorFieldProps {
  id: string
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  name: string
  inputRef: (element: HTMLInputElement | null) => void
  fallback: string
  error?: string
}

function ColorField({
  id,
  label,
  hint,
  value,
  onChange,
  onBlur,
  name,
  inputRef,
  fallback,
  error,
}: ColorFieldProps) {
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error}>
      <div className="flex items-center gap-3">
        <Input
          id={id}
          ref={inputRef}
          name={name}
          type="color"
          className="h-10 w-14 shrink-0 p-1"
          value={colorValue(value, fallback).toLowerCase()}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        <span className="text-[0.8rem] uppercase tracking-[0.04em] text-muted">
          {value}
        </span>
      </div>
    </Field>
  )
}

export function ResumeThemeDialog({
  open,
  onOpenChange,
  theme,
  baseStyles,
}: ResumeThemeDialogProps) {
  const { createResumeTheme, updateResumeTheme } = useJobriq()
  const [error, setError] = useState<string | null>(null)
  const source = theme?.styles ?? baseStyles
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResumeThemeFormValues>({
    resolver: zodResolver(resumeThemeFormSchema),
    defaultValues: {
      name: theme?.name ?? '',
      nameFont: source.nameFont,
      bodyFont: source.bodyFont,
      textColor: source.textColor,
      mutedColor: source.mutedColor,
      headingColor: source.headingColor,
      ruleColor: source.ruleColor,
      bodySize: source.bodySize,
      smallSize: source.smallSize,
      headingSize: source.headingSize,
      nameSize: source.nameSize,
      pageMargin: source.pageMargin,
      showRules: source.showRules,
    },
  })

  const watched = useWatch({ control })
  const preview = previewStyles(watched, source)

  const close = (next: boolean) => {
    if (!next) {
      setError(null)
    }

    onOpenChange(next)
  }

  const onSubmit = async (values: ResumeThemeFormValues) => {
    setError(null)

    const input = {
      name: values.name,
      styles: {
        nameFont: values.nameFont,
        bodyFont: values.bodyFont,
        textColor: values.textColor,
        mutedColor: values.mutedColor,
        headingColor: values.headingColor,
        ruleColor: values.ruleColor,
        bodySize: values.bodySize,
        smallSize: values.smallSize,
        headingSize: values.headingSize,
        nameSize: values.nameSize,
        pageMargin: values.pageMargin,
        showRules: values.showRules,
      },
    }

    try {
      if (theme) {
        await updateResumeTheme(theme.id, input)
      } else {
        await createResumeTheme(input)
      }

      onOpenChange(false)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The resume theme could not be saved.',
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      className="max-w-6xl"
      title={theme ? 'Edit resume theme' : 'New resume theme'}
      description="Design the DOCX resume and cover letter. Markdown exports stay plain text."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5"
      >
        {error ? (
          <div
            role="alert"
            className="border-l-2 border-accent bg-canvas px-3 py-2 text-[0.85rem] leading-6 text-body"
          >
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
          <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-1">
            <Field
          label="Name"
          htmlFor="resume-theme-name"
          error={errors.name?.message}
          hint="A short label, such as “Warm serif”."
        >
          <Input id="resume-theme-name" {...register('name')} />
        </Field>

        <fieldset className="space-y-4">
          <legend className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted">
            Typography
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Name font"
              htmlFor="resume-theme-name-font"
              error={errors.nameFont?.message}
            >
              <Select id="resume-theme-name-font" {...register('nameFont')}>
                {RESUME_THEME_FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Body font"
              htmlFor="resume-theme-body-font"
              error={errors.bodyFont?.message}
            >
              <Select id="resume-theme-body-font" {...register('bodyFont')}>
                {RESUME_THEME_FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Field
              label="Name size"
              htmlFor="resume-theme-name-size"
              error={errors.nameSize?.message}
              hint="14–28 pt"
            >
              <Input
                id="resume-theme-name-size"
                type="number"
                min={14}
                max={28}
                step={1}
                {...register('nameSize', { valueAsNumber: true })}
              />
            </Field>

            <Field
              label="Heading size"
              htmlFor="resume-theme-heading-size"
              error={errors.headingSize?.message}
              hint="10–20 pt"
            >
              <Input
                id="resume-theme-heading-size"
                type="number"
                min={10}
                max={20}
                step={1}
                {...register('headingSize', { valueAsNumber: true })}
              />
            </Field>

            <Field
              label="Body size"
              htmlFor="resume-theme-body-size"
              error={errors.bodySize?.message}
              hint="8–14 pt"
            >
              <Input
                id="resume-theme-body-size"
                type="number"
                min={8}
                max={14}
                step={1}
                {...register('bodySize', { valueAsNumber: true })}
              />
            </Field>

            <Field
              label="Small size"
              htmlFor="resume-theme-small-size"
              error={errors.smallSize?.message}
              hint="7–12 pt"
            >
              <Input
                id="resume-theme-small-size"
                type="number"
                min={7}
                max={12}
                step={1}
                {...register('smallSize', { valueAsNumber: true })}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted">
            Colors
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="textColor"
              render={({ field }) => (
                <ColorField
                  id="resume-theme-text-color"
                  label="Body text"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  inputRef={field.ref}
                  fallback={source.textColor}
                  error={errors.textColor?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="mutedColor"
              render={({ field }) => (
                <ColorField
                  id="resume-theme-muted-color"
                  label="Muted text"
                  hint="Contact line and dates."
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  inputRef={field.ref}
                  fallback={source.mutedColor}
                  error={errors.mutedColor?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="headingColor"
              render={({ field }) => (
                <ColorField
                  id="resume-theme-heading-color"
                  label="Name and headings"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  inputRef={field.ref}
                  fallback={source.headingColor}
                  error={errors.headingColor?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="ruleColor"
              render={({ field }) => (
                <ColorField
                  id="resume-theme-rule-color"
                  label="Section rules"
                  hint="Used when rules are shown."
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  inputRef={field.ref}
                  fallback={source.ruleColor}
                  error={errors.ruleColor?.message}
                />
              )}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted">
            Page
          </legend>

          <div className="grid items-end gap-4 sm:grid-cols-2">
            <Field
              label="Page margin"
              htmlFor="resume-theme-margin"
              error={errors.pageMargin?.message}
              hint="36–90 pt on every side"
            >
              <Input
                id="resume-theme-margin"
                type="number"
                min={36}
                max={90}
                step={1}
                {...register('pageMargin', { valueAsNumber: true })}
              />
            </Field>

            <label className="flex items-center gap-2 pb-2 text-[0.88rem] text-body">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                {...register('showRules')}
              />
              Show section rules
            </label>
          </div>
        </fieldset>

          </div>

          <div className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-2 lg:self-start">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted">
              Preview
            </p>
            <ResumeThemePreview
              styles={preview}
              className="mx-auto mt-2 w-full max-w-md"
            />
          </div>
        </div>

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
            {theme ? 'Save changes' : 'Create theme'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
