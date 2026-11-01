import type { JobriqState, Profile, PromptStyles } from './types'

export const BUILT_IN_PROMPT_STYLE_ID = '00000000-0000-0000-0000-000000000001'

export function createEmptyPromptStyles(): PromptStyles {
  return {
    styles: [],
    activeStyleId: null,
    baseline: {
      id: BUILT_IN_PROMPT_STYLE_ID,
      name: 'Default voice',
      instructions: '',
      isActive: true,
      createdAt: null,
      updatedAt: null,
    },
  }
}

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
    promptStyles: createEmptyPromptStyles(),
  }
}
