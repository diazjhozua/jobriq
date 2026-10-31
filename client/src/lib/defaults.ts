import type { JobriqState, Profile } from './types'

export function createEmptyProfile(): Profile {
  return {
    personal: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      website: '',
    },
    summaryType: 'professional',
    summary: '',
    experience: [],
    education: [],
    certifications: [],
    awards: [],
    skills: [],
    projects: [],
  }
}

export function createEmptyState(): JobriqState {
  return {
    profile: createEmptyProfile(),
    applications: [],
    standaloneResume: null,
  }
}
