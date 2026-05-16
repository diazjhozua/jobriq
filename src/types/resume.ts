export interface EnhancedBullet {
  original: string
  enhanced: string
  needsQuantification: boolean
}

export interface WorkExperience {
  id: string
  company: string
  title: string
  startDate: string
  endDate: string
  bullets: string[]
  enhancedBullets?: EnhancedBullet[]
}

export interface Education {
  id: string
  school: string
  degree: string
  field: string
  startDate: string
  endDate: string
  gpa?: string
}

export interface Project {
  id: string
  name: string
  url?: string
  bullets: string[]
  enhancedBullets?: EnhancedBullet[]
}

export interface Resume {
  version: string
  personal: {
    name: string
    email: string
    phone: string
    location: string
    linkedin?: string
    github?: string
    website?: string
  }
  summaryType: 'objective' | 'professional'
  summary: string
  experience: WorkExperience[]
  education: Education[]
  skills: string[]
  projects: Project[]
  jobDescription?: string
}

export interface KeywordResult {
  matched: string[]
  missing: string[]
}

export interface SessionState {
  resume: Resume
  keywordResult?: KeywordResult
  suggestions: string[]
}
