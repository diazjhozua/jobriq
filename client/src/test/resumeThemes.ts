import { createEmptyState, DEFAULT_RESUME_THEME_ID } from '../lib/defaults'
import type { JobriqState, ResumeTheme, ResumeThemeStyles } from '../lib/types'

export function themeStyles(
  overrides: Partial<ResumeThemeStyles> = {},
): ResumeThemeStyles {
  return {
    nameFont: 'Calibri',
    bodyFont: 'Calibri',
    textColor: '#1A1A1A',
    mutedColor: '#666666',
    headingColor: '#1A1A1A',
    ruleColor: '#CCCCCC',
    bodySize: 11,
    smallSize: 10,
    headingSize: 13,
    nameSize: 18,
    pageMargin: 72,
    showRules: true,
    ...overrides,
  }
}

export const CLASSIC_THEME_ID = DEFAULT_RESUME_THEME_ID
export const MODERN_THEME_ID = '00000000-0000-0000-0000-0000000000A2'
export const COMPACT_THEME_ID = '00000000-0000-0000-0000-0000000000A3'
export const EDITORIAL_THEME_ID = '00000000-0000-0000-0000-0000000000A4'
export const MONOCHROME_THEME_ID = '00000000-0000-0000-0000-0000000000A5'

export const classicTheme: ResumeTheme = {
  id: CLASSIC_THEME_ID,
  name: 'Classic',
  styles: themeStyles(),
  isActive: true,
  isBuiltIn: true,
  createdAt: null,
  updatedAt: null,
}

export const modernTheme: ResumeTheme = {
  id: MODERN_THEME_ID,
  name: 'Modern',
  styles: themeStyles({
    nameFont: 'Segoe UI',
    bodyFont: 'Segoe UI',
    textColor: '#1F2933',
    mutedColor: '#616E7C',
    headingColor: '#102A43',
    ruleColor: '#BCCCDC',
    bodySize: 10,
    smallSize: 9,
    headingSize: 12,
    nameSize: 20,
  }),
  isActive: false,
  isBuiltIn: true,
  createdAt: null,
  updatedAt: null,
}

export const compactTheme: ResumeTheme = {
  id: COMPACT_THEME_ID,
  name: 'Compact',
  styles: themeStyles({
    nameFont: 'Arial',
    bodyFont: 'Arial',
    textColor: '#202124',
    mutedColor: '#5F6368',
    headingColor: '#202124',
    ruleColor: '#DADCE0',
    bodySize: 10,
    smallSize: 9,
    headingSize: 11,
    nameSize: 16,
    pageMargin: 54,
  }),
  isActive: false,
  isBuiltIn: true,
  createdAt: null,
  updatedAt: null,
}

export const editorialTheme: ResumeTheme = {
  id: EDITORIAL_THEME_ID,
  name: 'Editorial',
  styles: themeStyles({
    nameFont: 'Georgia',
    bodyFont: 'Cambria',
    textColor: '#2B2B2B',
    mutedColor: '#6B6B6B',
    headingColor: '#1F3A5F',
    ruleColor: '#C9B99A',
    bodySize: 11,
    smallSize: 10,
    headingSize: 13,
    nameSize: 20,
  }),
  isActive: false,
  isBuiltIn: true,
  createdAt: null,
  updatedAt: null,
}

export const monochromeTheme: ResumeTheme = {
  id: MONOCHROME_THEME_ID,
  name: 'Monochrome',
  styles: themeStyles({
    nameFont: 'Times New Roman',
    bodyFont: 'Times New Roman',
    textColor: '#111111',
    mutedColor: '#555555',
    headingColor: '#111111',
    ruleColor: '#999999',
    headingSize: 12,
    nameSize: 18,
    showRules: false,
  }),
  isActive: false,
  isBuiltIn: true,
  createdAt: null,
  updatedAt: null,
}

export function builtInThemes(): ResumeTheme[] {
  return [
    { ...classicTheme },
    { ...modernTheme },
    { ...compactTheme },
    { ...editorialTheme },
    { ...monochromeTheme },
  ]
}

export function stateWithThemes(): JobriqState {
  const state = createEmptyState()
  state.resumeThemes = {
    themes: [],
    builtIns: builtInThemes(),
    activeThemeId: CLASSIC_THEME_ID,
  }

  return state
}
