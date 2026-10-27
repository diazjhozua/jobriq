import { z } from 'zod'
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
})

export const educationSchema = z.object({
  id: z.string(),
  school: z.string().trim().min(1, 'School is required'),
  degree: z.string(),
  field: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  gpa: z.string(),
})

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Project name is required'),
  url: urlOrEmpty('Enter a valid project URL'),
  bullets: z.array(z.string()),
})

export const profileSchema = z.object({
  personal: personalInfoSchema,
  summaryType: z.enum(['objective', 'professional']),
  summary: z.string(),
  experience: z.array(workExperienceSchema),
  education: z.array(educationSchema),
  skills: z.array(z.string()),
  projects: z.array(projectSchema),
})

const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? '')

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
})

const storedEducationSchema = educationSchema.extend({
  school: z.string(),
  gpa: nullableString,
})

const storedProjectSchema = projectSchema.extend({
  name: z.string(),
  url: nullableString,
})

const storedProfileSchema = z.object({
  personal: storedPersonalInfoSchema,
  summaryType: z.enum(['objective', 'professional']),
  summary: z.string(),
  experience: z.array(storedWorkExperienceSchema),
  education: z.array(storedEducationSchema),
  skills: z.array(z.string()),
  projects: z.array(storedProjectSchema),
})

export const enhancedBulletSchema = z.object({
  original: z.string(),
  enhanced: z.string(),
  needsQuantification: z.boolean(),
})

export const generatedExperienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.array(enhancedBulletSchema),
})

export const generatedProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable(),
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
  skills: z.array(z.string()),
  projects: z.array(generatedProjectSchema),
  keywords: keywordMatchSchema.nullable(),
  generatedAt: z.string(),
})

export const applicationSchema = z.object({
  id: z.string(),
  company: z.string().trim().min(1),
  role: z.string().trim().min(1),
  jobDescription: z.string(),
  status: z.enum(['saved', 'applied', 'interviewing', 'offer', 'rejected']),
  createdAt: z.string(),
  generatedResume: generatedResumeSchema.nullable().optional(),
})

export const apiStateSchema = z.object({
  profile: storedProfileSchema,
  applications: z.array(applicationSchema),
})

export const profileResponseSchema = z.object({
  profile: storedProfileSchema,
})

export const reviewSectionSchema = z.enum([
  'personal',
  'summary',
  'experience',
  'education',
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

export const applicationFormSchema = z.object({
  company: z.string().trim().min(1, 'Company is required'),
  role: z.string().trim().min(1, 'Role is required'),
  jobDescription: z.string().trim().min(1, 'Job description is required'),
  status: z.enum(['saved', 'applied', 'interviewing', 'offer', 'rejected']),
})

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>

export const isSummaryType = (value: string): value is SummaryType =>
  value === 'objective' || value === 'professional'

export const isApplicationStatus = (value: string): value is ApplicationStatus =>
  ['saved', 'applied', 'interviewing', 'offer', 'rejected'].includes(value)
