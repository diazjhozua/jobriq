import { z } from 'zod'
import {
  createEmptyPiiMasking,
  createEmptyPromptStyles,
  createEmptyResumeThemes,
  DEFAULT_RESUME_THEME_ID,
  RESUME_THEME_FONTS,
} from './defaults'
import { parseMonthYear } from './monthYear'
import type { ApplicationStatus, SummaryType } from './types'

const urlOrEmpty = (message: string) =>
  z.string().refine(
    (value) => value.trim() === '' || z.url().safeParse(value.trim()).success,
    message,
  )

export const personalInfoSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.email('Enter a valid email address'),
  phone: z.string(),
  location: z.string(),
  linkedin: urlOrEmpty('Enter a valid LinkedIn URL'),
  github: urlOrEmpty('Enter a valid GitHub URL'),
  website: urlOrEmpty('Enter a valid website URL'),
})

export const workExperienceSchema = z.object({
  id: z.string(),
  company: z.string().trim().min(1, 'Company is required'),
  title: z.string().trim().min(1, 'Title is required'),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.array(z.string()),
  skillsGained: z.array(z.string()),
})

export const educationSchema = z.object({
  id: z.string(),
  school: z.string().trim().min(1, 'School is required'),
  degree: z.string(),
  field: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  gpa: z.string(),
  skillsGained: z.array(z.string()),
})

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Project name is required'),
  url: urlOrEmpty('Enter a valid project URL'),
  startDate: z.string(),
  endDate: z.string(),
  associatedWith: z.string(),
  bullets: z.array(z.string()),
  skillsGained: z.array(z.string()),
})

export const certificationSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Certification name is required'),
  issuingOrganization: z.string(),
  issueDate: z.string(),
  expirationDate: z.string(),
  credentialId: z.string(),
  credentialUrl: urlOrEmpty('Enter a valid credential URL'),
  skillsGained: z.array(z.string()),
})

export const awardSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1, 'Award title is required'),
  associatedWith: z.string(),
  issuer: z.string(),
  issueDate: z.string(),
  description: z.string(),
})

export const profileSchema = z.object({
  personal: personalInfoSchema,
  summaryType: z.enum(['objective', 'professional']),
  summary: z.string(),
  experience: z.array(workExperienceSchema),
  education: z.array(educationSchema),
  certifications: z.array(certificationSchema),
  awards: z.array(awardSchema),
  skills: z.array(z.string()),
  projects: z.array(projectSchema),
})

const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? '')

const nullableStringArray = z
  .array(z.string())
  .nullish()
  .transform((value) => value ?? [])

const storedPersonalInfoSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedin: nullableString,
  github: nullableString,
  website: nullableString,
})

const storedWorkExperienceSchema = workExperienceSchema.extend({
  company: z.string(),
  title: z.string(),
  startDate: nullableString,
  endDate: nullableString,
  skillsGained: nullableStringArray,
})

const storedEducationSchema = educationSchema.extend({
  school: z.string(),
  gpa: nullableString,
  startDate: nullableString,
  endDate: nullableString,
  skillsGained: nullableStringArray,
})

const storedCertificationSchema = certificationSchema.extend({
  name: z.string(),
  issuingOrganization: nullableString,
  issueDate: nullableString,
  expirationDate: nullableString,
  credentialId: nullableString,
  credentialUrl: nullableString,
  skillsGained: nullableStringArray,
})

const storedAwardSchema = awardSchema.extend({
  title: z.string(),
  associatedWith: nullableString,
  issuer: nullableString,
  issueDate: nullableString,
  description: nullableString,
})

const storedProjectSchema = projectSchema.extend({
  name: z.string(),
  url: nullableString,
  startDate: nullableString,
  endDate: nullableString,
  associatedWith: nullableString,
  skillsGained: nullableStringArray,
})

const storedProfileSchema = z.object({
  personal: storedPersonalInfoSchema,
  summaryType: z.enum(['objective', 'professional']),
  summary: z.string(),
  experience: z.array(storedWorkExperienceSchema),
  education: z.array(storedEducationSchema),
  certifications: z
    .array(storedCertificationSchema)
    .nullish()
    .transform((value) => value ?? []),
  awards: z
    .array(storedAwardSchema)
    .nullish()
    .transform((value) => value ?? []),
  skills: z.array(z.string()),
  projects: z.array(storedProjectSchema),
})

export const enhancedBulletSchema = z.object({
  original: z.string(),
  enhanced: z.string(),
})

export const generatedExperienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  title: z.string(),
  startDate: nullableString,
  endDate: nullableString,
  bullets: z.array(enhancedBulletSchema),
})

export const generatedProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable(),
  startDate: nullableString,
  endDate: nullableString,
  associatedWith: nullableString,
  bullets: z.array(enhancedBulletSchema),
})

export const keywordMatchSchema = z.object({
  matched: z.array(z.string()),
  missing: z.array(z.string()),
})

export const generatedResumeSchema = z.object({
  personal: storedPersonalInfoSchema,
  summary: z.string(),
  experience: z.array(generatedExperienceSchema),
  education: z.array(storedEducationSchema),
  certifications: z
    .array(storedCertificationSchema)
    .nullish()
    .transform((value) => value ?? []),
  awards: z
    .array(storedAwardSchema)
    .nullish()
    .transform((value) => value ?? []),
  skills: z.array(z.string()),
  projects: z.array(generatedProjectSchema),
  keywords: keywordMatchSchema.nullable(),
  generatedAt: z.string(),
})

export const storedCoverLetterSchema = z.object({
  personal: storedPersonalInfoSchema,
  company: z.string(),
  role: z.string(),
  salutation: nullableString,
  paragraphs: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
  closing: nullableString,
  signature: nullableString,
  generatedAt: z.string(),
})

export const applicationSchema = z.object({
  id: z.string(),
  company: z.string().trim().min(1),
  role: z.string().trim().min(1),
  jobDescription: z.string(),
  status: z.enum(['saved', 'applied', 'interviewing', 'offer', 'rejected']),
  createdAt: z.string(),
  appliedDate: nullableString,
  generatedResume: generatedResumeSchema.nullable().optional(),
  coverLetter: storedCoverLetterSchema.nullable().optional(),
})

export const promptStyleSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  instructions: z.string(),
  isActive: z.boolean(),
  createdAt: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  updatedAt: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
})

export const promptStylesSchema = z.object({
  styles: z.array(promptStyleSchema),
  activeStyleId: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  baseline: promptStyleSchema,
})

export const promptStyleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'A style name is required')
    .max(80, 'Keep the name under 80 characters'),
  instructions: z
    .string()
    .trim()
    .min(1, 'Style instructions are required')
    .max(4000, 'Keep the instructions under 4000 characters'),
})

export type PromptStyleFormValues = z.infer<typeof promptStyleFormSchema>

export const resumeThemeStylesSchema = z.object({
  nameFont: z.string(),
  bodyFont: z.string(),
  textColor: z.string(),
  mutedColor: z.string(),
  headingColor: z.string(),
  ruleColor: z.string(),
  bodySize: z.number().int(),
  smallSize: z.number().int(),
  headingSize: z.number().int(),
  nameSize: z.number().int(),
  pageMargin: z.number().int(),
  showRules: z.boolean(),
})

export const resumeThemeSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  styles: resumeThemeStylesSchema,
  isActive: z.boolean(),
  isBuiltIn: z.boolean(),
  createdAt: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  updatedAt: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
})

export const resumeThemesSchema = z.object({
  themes: z.array(resumeThemeSchema),
  builtIns: z
    .array(resumeThemeSchema)
    .nullish()
    .transform((value) => value ?? []),
  activeThemeId: z
    .string()
    .nullish()
    .transform((value) => value ?? DEFAULT_RESUME_THEME_ID),
})

const hexColor = z
  .string()
  .trim()
  .regex(/^#?[0-9A-Fa-f]{6}$/, 'Enter a hex color such as #1A1A1A')

const themeFont = z
  .string()
  .refine(
    (font) => (RESUME_THEME_FONTS as readonly string[]).includes(font),
    'Choose a supported font',
  )

export const resumeThemeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'A theme name is required')
    .max(80, 'Keep the name under 80 characters'),
  nameFont: themeFont,
  bodyFont: themeFont,
  textColor: hexColor,
  mutedColor: hexColor,
  headingColor: hexColor,
  ruleColor: hexColor,
  bodySize: z
    .number({ error: 'Enter a body size' })
    .int()
    .min(8, 'Body size is at least 8pt')
    .max(14, 'Body size is at most 14pt'),
  smallSize: z
    .number({ error: 'Enter a small size' })
    .int()
    .min(7, 'Small size is at least 7pt')
    .max(12, 'Small size is at most 12pt'),
  headingSize: z
    .number({ error: 'Enter a heading size' })
    .int()
    .min(10, 'Heading size is at least 10pt')
    .max(20, 'Heading size is at most 20pt'),
  nameSize: z
    .number({ error: 'Enter a name size' })
    .int()
    .min(14, 'Name size is at least 14pt')
    .max(28, 'Name size is at most 28pt'),
  pageMargin: z
    .number({ error: 'Enter a page margin' })
    .int()
    .min(36, 'Margin is at least 36pt')
    .max(90, 'Margin is at most 90pt'),
  showRules: z.boolean(),
})

export type ResumeThemeFormValues = z.infer<typeof resumeThemeFormSchema>

export const piiMaskingSchema = z.object({
  enabled: z.boolean().default(true),
})

export const apiStateSchema = z.object({
  profile: storedProfileSchema,
  applications: z.array(applicationSchema),
  standaloneResume: generatedResumeSchema.nullable().default(null),
  promptStyles: promptStylesSchema
    .optional()
    .transform((value) => value ?? createEmptyPromptStyles()),
  resumeThemes: resumeThemesSchema
    .optional()
    .transform((value) => value ?? createEmptyResumeThemes()),
  piiMasking: piiMaskingSchema
    .nullish()
    .transform((value) => value ?? createEmptyPiiMasking()),
})

export const profileResponseSchema = z.object({
  profile: storedProfileSchema,
})

export const reviewSectionSchema = z.enum([
  'personal',
  'summary',
  'experience',
  'education',
  'certifications',
  'awards',
  'skills',
  'projects',
])

export const reviewCategorySchema = z
  .enum(['completeness', 'impact', 'clarity'])
  .catch('clarity')

export const reviewSuggestionSchema = z.object({
  id: z.string().min(1),
  section: reviewSectionSchema,
  itemId: z.string().nullish().transform((value) => value ?? null),
  bulletIndex: z.number().int().nonnegative().nullish().transform((value) => value ?? null),
  category: reviewCategorySchema,
  title: z.string().min(1),
  detail: nullableString,
  originalText: nullableString.transform((value) => (value === '' ? null : value)),
  proposedText: nullableString.transform((value) => (value === '' ? null : value)),
})

export const profileReviewSchema = z.object({
  suggestions: z.array(reviewSuggestionSchema),
})

export const applicationResponseSchema = z.object({
  application: applicationSchema,
})

const optionalMonthYear = z
  .string()
  .optional()
  .refine(
    (value) =>
      value === undefined ||
      value.trim() === '' ||
      parseMonthYear(value).kind === 'month',
    'Choose a month and year',
  )

export const applicationFormSchema = z.object({
  company: z.string().trim().min(1, 'Company is required'),
  role: z.string().trim().min(1, 'Role is required'),
  jobDescription: z.string().trim().min(1, 'Job description is required'),
  status: z.enum(['saved', 'applied', 'interviewing', 'offer', 'rejected']),
  appliedDate: optionalMonthYear,
})

export const applicationDetailsSchema = z.object({
  company: z.string().trim().min(1, 'Company is required'),
  role: z.string().trim().min(1, 'Role is required'),
  appliedDate: optionalMonthYear,
})

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>
export type ApplicationDetailsValues = z.infer<typeof applicationDetailsSchema>

export const isSummaryType = (value: string): value is SummaryType =>
  value === 'objective' || value === 'professional'

export const isApplicationStatus = (value: string): value is ApplicationStatus =>
  ['saved', 'applied', 'interviewing', 'offer', 'rejected'].includes(value)
