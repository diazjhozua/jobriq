import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, Plus, Upload } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useLocation } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/button'
import { Field } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { MonthYearField } from '../../components/ui/month-year-field'
import { Select } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { formatMonthYearValue } from '../../lib/monthYear'
import { profileSchema } from '../../lib/schemas'
import type {
  Award,
  Certification,
  Profile,
  ReviewSuggestion,
} from '../../lib/types'
import { useJobriq } from '../../providers/JobriqProvider'
import { AssociatedWithField } from './AssociatedWithField'
import { BulletListField } from './BulletListField'
import {
  AwardEntryNav,
  CertificationEntryNav,
  EducationEntryNav,
  ExperienceEntryNav,
  ProjectEntryNav,
} from './ProfileEntryNavs'
import { ProfileEntryCard } from './ProfileEntryCard'
import { ProfileReviewPanel } from './ProfileReviewPanel'
import { ProfileSaveBar } from './ProfileSaveBar'
import { ProfileSectionNav } from './ProfileSectionNav'
import { SkillsField } from './SkillsField'
import { StandaloneResumeDialog } from './StandaloneResumeDialog'
import { TemplateImportDialog } from './TemplateImportDialog'

interface SectionProps {
  id: string
  title: string
  description: string
  action?: ReactNode
  subNav?: ReactNode
  children: ReactNode
}

function Section({
  id,
  title,
  description,
  action,
  subNav,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
      className="grid scroll-mt-[8rem] gap-5 border-t border-border pt-8 first:border-t-0 first:pt-0 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-10"
    >
      <div className="lg:sticky lg:top-[7.75rem] lg:self-start">
        <h2 id={`${id}-title`} className="text-[1.3rem] font-medium leading-tight">
          {title}
        </h2>
        <p className="mt-2 max-w-[32ch] text-[0.8rem] leading-5 text-muted">
          {description}
        </p>
        {action ? <div className="mt-4">{action}</div> : null}
        {subNav}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function canonicalDates(profile: Profile): Profile {
  function fix<T extends { startDate: string; endDate: string }>(entry: T): T {
    return {
      ...entry,
      startDate: formatMonthYearValue(entry.startDate),
      endDate: formatMonthYearValue(entry.endDate),
    }
  }

  function fixCertification(entry: Certification): Certification {
    return {
      ...entry,
      issueDate: formatMonthYearValue(entry.issueDate),
      expirationDate: formatMonthYearValue(entry.expirationDate),
    }
  }

  function fixAward(entry: Award): Award {
    return {
      ...entry,
      issueDate: formatMonthYearValue(entry.issueDate),
    }
  }

  return {
    ...profile,
    experience: profile.experience.map(fix),
    education: profile.education.map(fix),
    certifications: profile.certifications.map(fixCertification),
    awards: profile.awards.map(fixAward),
    projects: profile.projects.map(fix),
  }
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
  const [skills, setSkills] = useState<string[]>(() => profile.skills)
  const [skillDraft, setSkillDraft] = useState('')
  const [saved, setSaved] = useState(false)
  const [saveCount, setSaveCount] = useState(0)
  const location = useLocation()
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
  const certifications = useFieldArray({ control, name: 'certifications' })
  const awards = useFieldArray({ control, name: 'awards' })
  const projects = useFieldArray({ control, name: 'projects' })

  const skillsDirty =
    JSON.stringify(skills) !== JSON.stringify(profile.skills) ||
    skillDraft.trim() !== ''
  const dirty = isDirty || skillsDirty

  useEffect(() => {
    if (!location.hash) {
      return
    }

    const target = document.getElementById(location.hash.slice(1))
    target?.scrollIntoView({ block: 'start' })
    target?.focus()
  }, [location.hash])

  useEffect(() => {
    if (!saved) {
      return
    }

    const timer = window.setTimeout(() => {
      const bar = document.getElementById('profile-save-bar')
      if (bar?.contains(document.activeElement)) {
        document
          .getElementById('profile-personal')
          ?.focus({ preventScroll: true })
      }

      setSaved(false)
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [saved, saveCount])

  const cleanBullets = (bullets: string[]) =>
    bullets.map((bullet) => bullet.trim()).filter(Boolean)

  const normalize = (values: Profile): Profile => {
    const dated = canonicalDates(values)

    return {
      ...dated,
      skills,
      experience: dated.experience.map((entry) => ({
        ...entry,
        bullets: cleanBullets(entry.bullets),
      })),
      projects: dated.projects.map((entry) => ({
        ...entry,
        bullets: cleanBullets(entry.bullets),
      })),
    }
  }

  const markSaved = () => {
    setSaved(true)
    setSaveCount((count) => count + 1)
  }

  const onSubmit = async (values: Profile) => {
    const next = normalize(values)

    try {
      await saveProfile(next)
      reset(next)
      setSkills(next.skills)
      markSaved()
    } catch {
      // The provider surfaces the failure in the sync banner.
    }
  }

  const handleImported = async (imported: Profile) => {
    const next = canonicalDates(imported)

    await saveProfile(next)
    reset(next)
    setSkills(next.skills)
    markSaved()
  }

  const getProfile = (): Profile => normalize(getValues())

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
          </>
        }
      />

      <ProfileSectionNav />

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
            <Controller
              control={control}
              name="summary"
              render={({ field }) => (
                <Textarea
                  id="summary"
                  rows={4}
                  autoGrow
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
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
                bullets: [''],
              })
            }
          >
            <Plus aria-hidden="true" size={16} />
            Add experience
          </Button>
        }
        subNav={<ExperienceEntryNav control={control} />}
      >
        {experience.fields.length === 0 ? (
          <p className="text-[0.85rem] italic text-muted">No experience added yet.</p>
        ) : (
          <div className="space-y-4">
            {experience.fields.map((entry, index) => (
              <ProfileEntryCard
                key={entry.id}
                section="experience"
                index={index}
                heading={`Experience ${index + 1}`}
                removeLabel={`Remove experience ${index + 1}`}
                onRemove={() => experience.remove(index)}
              >
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
                  <MonthYearField
                    control={control}
                    name={`experience.${index}.startDate`}
                    id={`experience-${index}-start`}
                    label="Start date"
                    pickerLabel={`Experience ${index + 1} start date`}
                    error={errors.experience?.[index]?.startDate?.message}
                  />
                  <MonthYearField
                    control={control}
                    name={`experience.${index}.endDate`}
                    id={`experience-${index}-end`}
                    label="End date"
                    pickerLabel={`Experience ${index + 1} end date`}
                    error={errors.experience?.[index]?.endDate?.message}
                    allowPresent
                  />
                  <Controller
                    control={control}
                    name={`experience.${index}.bullets`}
                    render={({ field, fieldState }) => (
                      <BulletListField
                        id={`experience-${index}-bullets`}
                        itemLabel={`Experience ${index + 1}`}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        className="sm:col-span-2"
                      />
                    )}
                  />
              </ProfileEntryCard>
            ))}
          </div>
        )}
      </Section>

      <Section
        id="profile-education"
        title="Education"
        description="Degrees and relevant coursework."
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
        subNav={<EducationEntryNav control={control} />}
      >
        {education.fields.length === 0 ? (
          <p className="text-[0.85rem] italic text-muted">No education added yet.</p>
        ) : (
          <div className="space-y-4">
            {education.fields.map((entry, index) => (
              <ProfileEntryCard
                key={entry.id}
                section="education"
                index={index}
                heading={`Education ${index + 1}`}
                removeLabel={`Remove education ${index + 1}`}
                onRemove={() => education.remove(index)}
              >
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
                  <MonthYearField
                    control={control}
                    name={`education.${index}.startDate`}
                    id={`education-${index}-start`}
                    label="Start date"
                    pickerLabel={`Education ${index + 1} start date`}
                    error={errors.education?.[index]?.startDate?.message}
                  />
                  <MonthYearField
                    control={control}
                    name={`education.${index}.endDate`}
                    id={`education-${index}-end`}
                    label="End date"
                    pickerLabel={`Education ${index + 1} end date`}
                    error={errors.education?.[index]?.endDate?.message}
                    allowPresent
                  />
              </ProfileEntryCard>
            ))}
          </div>
        )}
      </Section>

      <Section
        id="profile-certifications"
        title="Licenses & certifications"
        description="Credentials that back up your expertise."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              certifications.append({
                id: crypto.randomUUID(),
                name: '',
                issuingOrganization: '',
                issueDate: '',
                expirationDate: '',
                credentialId: '',
                credentialUrl: '',
              })
            }
          >
            <Plus aria-hidden="true" size={16} />
            Add certification
          </Button>
        }
        subNav={<CertificationEntryNav control={control} />}
      >
        {certifications.fields.length === 0 ? (
          <p className="text-[0.85rem] italic text-muted">
            No certifications added yet.
          </p>
        ) : (
          <div className="space-y-4">
            {certifications.fields.map((entry, index) => (
              <ProfileEntryCard
                key={entry.id}
                section="certifications"
                index={index}
                heading={`Certification ${index + 1}`}
                removeLabel={`Remove certification ${index + 1}`}
                onRemove={() => certifications.remove(index)}
              >
                <Field
                  label="Name"
                  htmlFor={`certification-${index}-name`}
                  error={errors.certifications?.[index]?.name?.message}
                >
                  <Input
                    id={`certification-${index}-name`}
                    {...register(`certifications.${index}.name`)}
                  />
                </Field>
                <Field
                  label="Issuing organization"
                  htmlFor={`certification-${index}-issuer`}
                  error={
                    errors.certifications?.[index]?.issuingOrganization?.message
                  }
                >
                  <Input
                    id={`certification-${index}-issuer`}
                    {...register(`certifications.${index}.issuingOrganization`)}
                  />
                </Field>
                <MonthYearField
                  control={control}
                  name={`certifications.${index}.issueDate`}
                  id={`certification-${index}-issue`}
                  label="Issue date"
                  pickerLabel={`Certification ${index + 1} issue date`}
                  error={errors.certifications?.[index]?.issueDate?.message}
                />
                <MonthYearField
                  control={control}
                  name={`certifications.${index}.expirationDate`}
                  id={`certification-${index}-expiration`}
                  label="Expiration date (optional)"
                  pickerLabel={`Certification ${index + 1} expiration date`}
                  error={errors.certifications?.[index]?.expirationDate?.message}
                />
                <Field
                  label="Credential ID"
                  htmlFor={`certification-${index}-credential-id`}
                  error={errors.certifications?.[index]?.credentialId?.message}
                >
                  <Input
                    id={`certification-${index}-credential-id`}
                    {...register(`certifications.${index}.credentialId`)}
                  />
                </Field>
                <Field
                  label="Credential URL"
                  htmlFor={`certification-${index}-credential-url`}
                  error={errors.certifications?.[index]?.credentialUrl?.message}
                >
                  <Input
                    id={`certification-${index}-credential-url`}
                    placeholder="https://..."
                    {...register(`certifications.${index}.credentialUrl`)}
                  />
                </Field>
              </ProfileEntryCard>
            ))}
          </div>
        )}
      </Section>

      <Section
        id="profile-awards"
        title="Honors & awards"
        description="Recognition that sets you apart."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              awards.append({
                id: crypto.randomUUID(),
                title: '',
                associatedWith: '',
                issuer: '',
                issueDate: '',
                description: '',
              })
            }
          >
            <Plus aria-hidden="true" size={16} />
            Add award
          </Button>
        }
        subNav={<AwardEntryNav control={control} />}
      >
        {awards.fields.length === 0 ? (
          <p className="text-[0.85rem] italic text-muted">
            No awards added yet.
          </p>
        ) : (
          <div className="space-y-4">
            {awards.fields.map((entry, index) => (
              <ProfileEntryCard
                key={entry.id}
                section="awards"
                index={index}
                heading={`Award ${index + 1}`}
                removeLabel={`Remove award ${index + 1}`}
                onRemove={() => awards.remove(index)}
              >
                <Field
                  label="Title"
                  htmlFor={`award-${index}-title`}
                  error={errors.awards?.[index]?.title?.message}
                >
                  <Input
                    id={`award-${index}-title`}
                    {...register(`awards.${index}.title`)}
                  />
                </Field>
                <Field
                  label="Associated with"
                  htmlFor={`award-${index}-associated`}
                  hint="Where the award came from, such as a company or school."
                  error={errors.awards?.[index]?.associatedWith?.message}
                >
                  <Input
                    id={`award-${index}-associated`}
                    {...register(`awards.${index}.associatedWith`)}
                  />
                </Field>
                <Field
                  label="Issuer"
                  htmlFor={`award-${index}-issuer`}
                  error={errors.awards?.[index]?.issuer?.message}
                >
                  <Input
                    id={`award-${index}-issuer`}
                    {...register(`awards.${index}.issuer`)}
                  />
                </Field>
                <MonthYearField
                  control={control}
                  name={`awards.${index}.issueDate`}
                  id={`award-${index}-issue`}
                  label="Issue date"
                  pickerLabel={`Award ${index + 1} issue date`}
                  error={errors.awards?.[index]?.issueDate?.message}
                />
                <Field
                  label="Description"
                  htmlFor={`award-${index}-description`}
                  error={errors.awards?.[index]?.description?.message}
                  className="sm:col-span-2"
                >
                  <Controller
                    control={control}
                    name={`awards.${index}.description`}
                    render={({ field }) => (
                      <Textarea
                        id={`award-${index}-description`}
                        rows={3}
                        autoGrow
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </Field>
              </ProfileEntryCard>
            ))}
          </div>
        )}
      </Section>

      <Section
        id="profile-skills"
        title="Skills"
        description="Tools, languages, and methods, shown as tags."
      >
        <SkillsField
          id="skills"
          skills={skills}
          onChange={setSkills}
          onDraftChange={setSkillDraft}
        />
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
                startDate: '',
                endDate: '',
                associatedWith: '',
                bullets: [''],
              })
            }
          >
            <Plus aria-hidden="true" size={16} />
            Add project
          </Button>
        }
        subNav={<ProjectEntryNav control={control} />}
      >
        {projects.fields.length === 0 ? (
          <p className="text-[0.85rem] italic text-muted">No projects added yet.</p>
        ) : (
          <div className="space-y-4">
            {projects.fields.map((entry, index) => (
              <ProfileEntryCard
                key={entry.id}
                section="projects"
                index={index}
                heading={`Project ${index + 1}`}
                removeLabel={`Remove project ${index + 1}`}
                onRemove={() => projects.remove(index)}
              >
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
                  <AssociatedWithField
                    control={control}
                    index={index}
                    id={`project-${index}-associated`}
                  />
                  <MonthYearField
                    control={control}
                    name={`projects.${index}.startDate`}
                    id={`project-${index}-start`}
                    label="Start date"
                    pickerLabel={`Project ${index + 1} start date`}
                    error={errors.projects?.[index]?.startDate?.message}
                  />
                  <MonthYearField
                    control={control}
                    name={`projects.${index}.endDate`}
                    id={`project-${index}-end`}
                    label="End date"
                    pickerLabel={`Project ${index + 1} end date`}
                    error={errors.projects?.[index]?.endDate?.message}
                    allowPresent
                  />
                  <Controller
                    control={control}
                    name={`projects.${index}.bullets`}
                    render={({ field, fieldState }) => (
                      <BulletListField
                        id={`project-${index}-bullets`}
                        itemLabel={`Project ${index + 1}`}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        className="sm:col-span-2"
                      />
                    )}
                  />
              </ProfileEntryCard>
            ))}
          </div>
        )}
      </Section>
        <TemplateImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImported={handleImported}
        />
        <p role="status" className="sr-only">
          {isSubmitting ? 'Saving profile…' : saved ? 'Profile saved.' : ''}
        </p>
        <ProfileSaveBar
          dirty={dirty}
          saved={saved}
          submitting={isSubmitting}
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
