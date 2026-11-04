export type SummaryType = 'objective' | 'professional'

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'

export interface PersonalInfo {
  name: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  website: string
}

export interface WorkExperience {
  id: string
  company: string
  title: string
  startDate: string
  endDate: string
  bullets: string[]
  skillsGained: string[]
}

export interface Education {
  id: string
  school: string
  degree: string
  field: string
  startDate: string
  endDate: string
  gpa: string
  skillsGained: string[]
}

export interface Certification {
  id: string
  name: string
  issuingOrganization: string
  issueDate: string
  expirationDate: string
  credentialId: string
  credentialUrl: string
  skillsGained: string[]
}

export interface Award {
  id: string
  title: string
  associatedWith: string
  issuer: string
  issueDate: string
  description: string
}

export interface Project {
  id: string
  name: string
  url: string
  startDate: string
  endDate: string
  associatedWith: string
  bullets: string[]
  skillsGained: string[]
}

export interface Profile {
  personal: PersonalInfo
  summaryType: SummaryType
  summary: string
  experience: WorkExperience[]
  education: Education[]
  certifications: Certification[]
  awards: Award[]
  skills: string[]
  projects: Project[]
}

export type ReviewSection =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'awards'
  | 'skills'
  | 'projects'

export type ReviewCategory = 'completeness' | 'impact' | 'clarity'

export interface ReviewSuggestion {
  id: string
  section: ReviewSection
  itemId: string | null
  bulletIndex: number | null
  category: ReviewCategory
  title: string
  detail: string
  originalText: string | null
  proposedText: string | null
}

export interface ProfileReview {
  suggestions: ReviewSuggestion[]
}

export interface EnhancedBullet {
  original: string
  enhanced: string
}

export interface GeneratedExperience {
  id: string
  company: string
  title: string
  startDate: string
  endDate: string
  bullets: EnhancedBullet[]
}

export interface GeneratedProject {
  id: string
  name: string
  url: string | null
  startDate: string
  endDate: string
  associatedWith: string
  bullets: EnhancedBullet[]
}

export interface KeywordMatch {
  matched: string[]
  missing: string[]
}

export interface GeneratedResume {
  personal: PersonalInfo
  summary: string
  experience: GeneratedExperience[]
  education: Education[]
  certifications: Certification[]
  awards: Award[]
  skills: string[]
  projects: GeneratedProject[]
  keywords: KeywordMatch | null
  generatedAt: string
}

export interface CoverLetter {
  personal: PersonalInfo
  company: string
  role: string
  salutation: string
  paragraphs: string[]
  closing: string
  signature: string
  generatedAt: string
}

export interface JobApplication {
  id: string
  company: string
  role: string
  jobDescription: string
  status: ApplicationStatus
  createdAt: string
  appliedDate: string
  generatedResume?: GeneratedResume | null
  coverLetter?: CoverLetter | null
}

export interface PromptStyle {
  id: string
  name: string
  instructions: string
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface PromptStyles {
  styles: PromptStyle[]
  activeStyleId: string | null
  baseline: PromptStyle
}

export interface ResumeThemeStyles {
  nameFont: string
  bodyFont: string
  textColor: string
  mutedColor: string
  headingColor: string
  ruleColor: string
  bodySize: number
  smallSize: number
  headingSize: number
  nameSize: number
  pageMargin: number
  showRules: boolean
}

export interface ResumeTheme {
  id: string
  name: string
  styles: ResumeThemeStyles
  isActive: boolean
  isBuiltIn: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface ResumeThemes {
  themes: ResumeTheme[]
  builtIns: ResumeTheme[]
  activeThemeId: string
}

export interface PiiMasking {
  enabled: boolean
}

export interface JobriqState {
  profile: Profile
  applications: JobApplication[]
  standaloneResume: GeneratedResume | null
  promptStyles: PromptStyles
  resumeThemes: ResumeThemes
  piiMasking: PiiMasking
}

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
]

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
}
