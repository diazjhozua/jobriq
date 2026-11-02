import type {
  JobriqState,
  Profile,
  PromptStyles,
  ResumeThemes,
} from './types'

export const BUILT_IN_PROMPT_STYLE_ID = '00000000-0000-0000-0000-000000000001'

export const DEFAULT_RESUME_THEME_ID = '00000000-0000-0000-0000-0000000000A1'

// Mirrors Jobriq.Domain.ResumeThemes.ResumeThemeFonts; the server rejects
// anything outside this list.
export const RESUME_THEME_FONTS = [
  'Calibri',
  'Cambria',
  'Garamond',
  'Georgia',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Segoe UI',
  'Trebuchet MS',
  'Verdana',
] as const

export function createEmptyResumeThemes(): ResumeThemes {
  return {
    themes: [],
    builtIns: [],
    activeThemeId: DEFAULT_RESUME_THEME_ID,
  }
}

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
    resumeThemes: createEmptyResumeThemes(),
  }
}
