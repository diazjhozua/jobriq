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
}

export interface Education {
  id: string
  school: string
  degree: string
  field: string
  startDate: string
  endDate: string
  gpa: string
}

export interface Project {
  id: string
  name: string
  url: string
  bullets: string[]
}

export interface Profile {
  personal: PersonalInfo
  summaryType: SummaryType
  summary: string
  experience: WorkExperience[]
  education: Education[]
  skills: string[]
  projects: Project[]
}

export type ReviewSection =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
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
  needsQuantification: boolean
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
  skills: string[]
  projects: GeneratedProject[]
  keywords: KeywordMatch | null
  generatedAt: string
}

export interface JobApplication {
  id: string
  company: string
  role: string
  jobDescription: string
  status: ApplicationStatus
  createdAt: string
  generatedResume?: GeneratedResume | null
}

export interface JobriqState {
  profile: Profile
  applications: JobApplication[]
  standaloneResume: GeneratedResume | null
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
