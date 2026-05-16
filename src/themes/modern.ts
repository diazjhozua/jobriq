import type { ResumeTheme } from '../types/theme.js'

export const theme: ResumeTheme = {
  name: 'modern',
  font: 'Calibri',
  colors: { text: '1A1A1A', accent: '1E3A5F', muted: '555555', rule: '1E3A5F' },
  sizes: { name: 36, heading: 26, subheading: 22, body: 22 },
  layout: {
    headerAlignment: 'left',
    sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects'],
    sectionDivider: 'rule',
    headingUppercase: false,
  },
}
