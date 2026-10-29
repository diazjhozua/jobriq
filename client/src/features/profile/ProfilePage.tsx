import { zodResolver } from '@hookform/resolvers/zod'
import { Check, FileText, Plus, Trash2, Upload } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/button'
import { Field } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { profileSchema } from '../../lib/schemas'
import type { Profile, ReviewSuggestion } from '../../lib/types'
import { parseSkills } from '../../lib/utils'
import { useJobriq } from '../../providers/JobriqProvider'
import { ProfileReviewPanel } from './ProfileReviewPanel'
import { StandaloneResumeDialog } from './StandaloneResumeDialog'
import { TemplateImportDialog } from './TemplateImportDialog'

interface SectionProps {
  id: string
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}

function Section({ id, title, description, action, children }: SectionProps) {
  return (
    <section className="grid gap-5 border-t border-border pt-8 first:border-t-0 first:pt-0 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-10">
      <div className="lg:sticky lg:top-[6.5rem] lg:self-start">
        <h2 id={id} className="text-[1.3rem] font-medium leading-tight">
          {title}
        </h2>
        <p className="mt-2 max-w-[32ch] text-[0.8rem] leading-5 text-muted">
          {description}
        </p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

export function ProfilePage() {
  const {
    profile,
    saveProfile,
    review,
    reviewedAt,
    reviewing,
    reviewError,
    reviewProfile,
  } = useJobriq()
  const [skillsText, setSkillsText] = useState(() => profile.skills.join(', '))
  const [saved, setSaved] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Profile>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
  })

  const experience = useFieldArray({ control, name: 'experience' })
  const education = useFieldArray({ control, name: 'education' })
  const projects = useFieldArray({ control, name: 'projects' })

  const skillsDirty = skillsText !== profile.skills.join(', ')

  useEffect(() => {
    if (!saved) {
      return
    }

    const timer = window.setTimeout(() => setSaved(false), 3000)
    return () => window.clearTimeout(timer)
  }, [saved])

  const onSubmit = async (values: Profile) => {
    const next: Profile = { ...values, skills: parseSkills(skillsText) }

    try {
      await saveProfile(next)
      reset(next)
      setSkillsText(next.skills.join(', '))
      setSaved(true)
    } catch {
      // The provider surfaces the failure in the sync banner.
    }
  }

  const handleImported = async (imported: Profile) => {
    await saveProfile(imported)
    reset(imported)
    setSkillsText(imported.skills.join(', '))
    setSaved(true)
  }

  const getProfile = (): Profile => ({
    ...getValues(),
    skills: parseSkills(skillsText),
  })

  const applySuggestion = (suggestion: ReviewSuggestion): boolean => {
    const proposedText = suggestion.proposedText
    if (!proposedText) {
      return false
    }

    if (suggestion.section === 'summary') {
      const currentSummary = getValues('summary')
      if (
        suggestion.originalText === null
          ? currentSummary.trim() !== ''
          : currentSummary.trim() !== suggestion.originalText
      ) {
        return false
      }

      setValue('summary', proposedText, {
        shouldDirty: true,
        shouldValidate: true,
      })
      return true
    }

    if (
      (suggestion.section !== 'experience' && suggestion.section !== 'projects') ||
      !suggestion.itemId ||
      suggestion.bulletIndex === null
    ) {
      return false
    }

    const items = getValues(suggestion.section)
    const index = items.findIndex((item) => item.id === suggestion.itemId)
    const item = items[index]
    const currentBullet = item?.bullets[suggestion.bulletIndex]

    if (
      !item ||
      currentBullet === undefined ||
      (suggestion.originalText === null
        ? currentBullet.trim() !== ''
        : currentBullet.trim() !== suggestion.originalText)
    ) {
      return false
    }

    const bullets = [...item.bullets]
    bullets[suggestion.bulletIndex] = proposedText

    if (suggestion.section === 'experience') {
      setValue(`experience.${index}.bullets`, bullets, {
        shouldDirty: true,
        shouldValidate: true,
      })
    } else {
      setValue(`projects.${index}.bullets`, bullets, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }

    return true
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_21rem]">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="min-w-0 space-y-9">
      <PageHeader
        title="Profile"
        description="Everything here feeds your resumes, whether you tailor one to an application or generate one on its own."
        actions={
          <>
            <span role="status" className="mr-1 text-[0.8rem] text-muted">
              {saved ? (
                <span className="inline-flex items-center gap-1.5">
                  <Check aria-hidden="true" size={15} className="text-primary" />
                  Saved
                </span>
              ) : null}
            </span>
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              disabled={isSubmitting}
            >
              <Upload aria-hidden="true" size={15} />
              Import template
            </Button>
            <Button
              variant="outline"
              onClick={() => setResumeOpen(true)}
              disabled={isSubmitting}
            >
              <FileText aria-hidden="true" size={15} />
              Resume
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto"
              disabled={isSubmitting || (!isDirty && !skillsDirty)}
            >
              Save profile
            </Button>
          </>
        }
      />

      <Section
        id="profile-personal"
        title="Personal details"
        description="Shown at the top of every generated resume."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" error={errors.personal?.name?.message}>
            <Input id="name" autoComplete="name" {...register('personal.name')} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.personal?.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register('personal.email')} />
          </Field>
          <Field label="Phone" htmlFor="phone" error={errors.personal?.phone?.message}>
            <Input id="phone" autoComplete="tel" {...register('personal.phone')} />
          </Field>
          <Field label="Location" htmlFor="location" error={errors.personal?.location?.message}>
            <Input id="location" autoComplete="address-level2" {...register('personal.location')} />
          </Field>
          <Field label="LinkedIn" htmlFor="linkedin" error={errors.personal?.linkedin?.message}>
            <Input id="linkedin" placeholder="https://linkedin.com/in/..." {...register('personal.linkedin')} />
          </Field>
          <Field label="GitHub" htmlFor="github" error={errors.personal?.github?.message}>
            <Input id="github" placeholder="https://github.com/..." {...register('personal.github')} />
          </Field>
          <Field label="Website" htmlFor="website" error={errors.personal?.website?.message} className="sm:col-span-2">
            <Input id="website" placeholder="https://..." {...register('personal.website')} />
          </Field>
        </div>
      </Section>

      <Section
        id="profile-summary"
        title="Summary"
        description="Write your own, or leave it blank and AI will draft one from your experience."
      >
        <div className="grid gap-4">
          <Field label="Summary style" htmlFor="summaryType" error={errors.summaryType?.message}>
            <Select id="summaryType" {...register('summaryType')}>
              <option value="professional">Professional summary (2+ years)</option>
              <option value="objective">Objective (under 2 years)</option>
            </Select>
          </Field>
          <Field
            label="Summary"
            htmlFor="summary"
            error={errors.summary?.message}
            hint="Leave blank to let AI write it from your experience."
          >
            <Textarea id="summary" rows={4} {...register('summary')} />
          </Field>
        </div>
      </Section>

      <Section
        id="profile-experience"
        title="Work experience"
        description="Each bullet should describe an accomplishment."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              experience.append({
                id: crypto.randomUUID(),
                company: '',
                title: '',
                startDate: '',
                endDate: '',
                bullets: [],
              })
            }
          >
            <Plus aria-hidden="true" size={16} />
            Add experience
          </Button>
        }
      >
        {experience.fields.length === 0 ? (
          <p className="text-[0.85rem] italic text-muted">No experience added yet.</p>
        ) : (
          <div className="space-y-4">
            {experience.fields.map((entry, index) => (
              <div key={entry.id} className="border-t border-border pt-5 first:border-t-0 first:pt-0">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-sans text-[0.78rem] font-medium tracking-[0.01em] text-muted">
                    Experience {index + 1}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => experience.remove(index)}
                    aria-label={`Remove experience ${index + 1}`}
                  >
                    <Trash2 aria-hidden="true" size={16} />
                    Remove
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Company"
                    htmlFor={`experience-${index}-company`}
                    error={errors.experience?.[index]?.company?.message}
                  >
                    <Input
                      id={`experience-${index}-company`}
                      {...register(`experience.${index}.company`)}
                    />
                  </Field>
                  <Field
                    label="Title"
                    htmlFor={`experience-${index}-title`}
                    error={errors.experience?.[index]?.title?.message}
                  >
                    <Input
                      id={`experience-${index}-title`}
                      {...register(`experience.${index}.title`)}
                    />
                  </Field>
                  <Field
                    label="Start date"
                    htmlFor={`experience-${index}-start`}
                    error={errors.experience?.[index]?.startDate?.message}
                  >
                    <Input
                      id={`experience-${index}-start`}
                      placeholder="Jan 2022"
                      {...register(`experience.${index}.startDate`)}
                    />
                  </Field>
                  <Field
                    label="End date"
                    htmlFor={`experience-${index}-end`}
                    error={errors.experience?.[index]?.endDate?.message}
                  >
                    <Input
                      id={`experience-${index}-end`}
                      placeholder="Present"
                      {...register(`experience.${index}.endDate`)}
                    />
                  </Field>
                  <Field
                    label="Bullets"
                    htmlFor={`experience-${index}-bullets`}
                    hint="One achievement per line."
                    error={errors.experience?.[index]?.bullets?.message}
                    className="sm:col-span-2"
                  >
                    <Controller
                      control={control}
                      name={`experience.${index}.bullets`}
                      render={({ field }) => (
                        <Textarea
                          id={`experience-${index}-bullets`}
                          rows={4}
                          value={field.value.join('\n')}
                          onChange={(event) => field.onChange(event.target.value.split('\n'))}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        id="profile-education"
        title="Education"
        description="Degrees, certifications, and relevant coursework."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              education.append({
                id: crypto.randomUUID(),
                school: '',
                degree: '',
                field: '',
                startDate: '',
                endDate: '',
                gpa: '',
              })
            }
          >
            <Plus aria-hidden="true" size={16} />
            Add education
          </Button>
        }
      >
        {education.fields.length === 0 ? (
          <p className="text-[0.85rem] italic text-muted">No education added yet.</p>
        ) : (
          <div className="space-y-4">
            {education.fields.map((entry, index) => (
              <div key={entry.id} className="border-t border-border pt-5 first:border-t-0 first:pt-0">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-sans text-[0.78rem] font-medium tracking-[0.01em] text-muted">
                    Education {index + 1}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => education.remove(index)}
                    aria-label={`Remove education ${index + 1}`}
                  >
                    <Trash2 aria-hidden="true" size={16} />
                    Remove
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="School"
                    htmlFor={`education-${index}-school`}
                    error={errors.education?.[index]?.school?.message}
                  >
                    <Input
                      id={`education-${index}-school`}
                      {...register(`education.${index}.school`)}
                    />
                  </Field>
                  <Field
                    label="Degree"
                    htmlFor={`education-${index}-degree`}
                    error={errors.education?.[index]?.degree?.message}
                  >
                    <Input
                      id={`education-${index}-degree`}
                      placeholder="BSc"
                      {...register(`education.${index}.degree`)}
                    />
                  </Field>
                  <Field
                    label="Field"
                    htmlFor={`education-${index}-field`}
                    error={errors.education?.[index]?.field?.message}
                  >
                    <Input
                      id={`education-${index}-field`}
                      placeholder="Computer Science"
                      {...register(`education.${index}.field`)}
                    />
                  </Field>
                  <Field
                    label="GPA (optional)"
                    htmlFor={`education-${index}-gpa`}
                    error={errors.education?.[index]?.gpa?.message}
                  >
                    <Input
                      id={`education-${index}-gpa`}
                      {...register(`education.${index}.gpa`)}
                    />
                  </Field>
                  <Field
                    label="Start date"
                    htmlFor={`education-${index}-start`}
                    error={errors.education?.[index]?.startDate?.message}
                  >
                    <Input
                      id={`education-${index}-start`}
                      placeholder="2018"
                      {...register(`education.${index}.startDate`)}
                    />
                  </Field>
                  <Field
                    label="End date"
                    htmlFor={`education-${index}-end`}
                    error={errors.education?.[index]?.endDate?.message}
                  >
                    <Input
                      id={`education-${index}-end`}
                      placeholder="2022"
                      {...register(`education.${index}.endDate`)}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        id="profile-skills"
        title="Skills"
        description="Comma-separated tools, languages, and methods."
      >
        <Field label="Skills" htmlFor="skills" hint="Separate skills with commas.">
          <Input
            id="skills"
            value={skillsText}
            onChange={(event) => setSkillsText(event.target.value)}
            placeholder="TypeScript, React, .NET, PostgreSQL"
          />
        </Field>
      </Section>

      <Section
        id="profile-projects"
        title="Projects"
        description="Side projects that show what you can build."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              projects.append({
                id: crypto.randomUUID(),
                name: '',
                url: '',
                bullets: [],
              })
            }
          >
            <Plus aria-hidden="true" size={16} />
            Add project
          </Button>
        }
      >
        {projects.fields.length === 0 ? (
          <p className="text-[0.85rem] italic text-muted">No projects added yet.</p>
        ) : (
          <div className="space-y-4">
            {projects.fields.map((entry, index) => (
              <div key={entry.id} className="border-t border-border pt-5 first:border-t-0 first:pt-0">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-sans text-[0.78rem] font-medium tracking-[0.01em] text-muted">
                    Project {index + 1}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => projects.remove(index)}
                    aria-label={`Remove project ${index + 1}`}
                  >
                    <Trash2 aria-hidden="true" size={16} />
                    Remove
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Name"
                    htmlFor={`project-${index}-name`}
                    error={errors.projects?.[index]?.name?.message}
                  >
                    <Input
                      id={`project-${index}-name`}
                      {...register(`projects.${index}.name`)}
                    />
                  </Field>
                  <Field
                    label="URL (optional)"
                    htmlFor={`project-${index}-url`}
                    error={errors.projects?.[index]?.url?.message}
                  >
                    <Input
                      id={`project-${index}-url`}
                      placeholder="https://github.com/..."
                      {...register(`projects.${index}.url`)}
                    />
                  </Field>
                  <Field
                    label="Bullets"
                    htmlFor={`project-${index}-bullets`}
                    hint="One achievement per line."
                    error={errors.projects?.[index]?.bullets?.message}
                    className="sm:col-span-2"
                  >
                    <Controller
                      control={control}
                      name={`projects.${index}.bullets`}
                      render={({ field }) => (
                        <Textarea
                          id={`project-${index}-bullets`}
                          rows={3}
                          value={field.value.join('\n')}
                          onChange={(event) => field.onChange(event.target.value.split('\n'))}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
        <TemplateImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImported={handleImported}
        />
      </form>
      <StandaloneResumeDialog
        open={resumeOpen}
        onOpenChange={setResumeOpen}
        getProfile={getProfile}
      />
      <ProfileReviewPanel
        review={review}
        reviewedAt={reviewedAt}
        reviewing={reviewing}
        saving={isSubmitting}
        error={reviewError}
        onReview={() => void reviewProfile(getProfile())}
        onApply={applySuggestion}
      />
    </div>
  )
}
