import type { ResumeTheme } from '../types/theme.js'

export const theme: ResumeTheme = {
  name: 'executive',
  font: 'Georgia',
  colors: { text: '1A1A1A', accent: '1A2744', muted: '555555', rule: '888888' },
  sizes: { name: 36, heading: 26, subheading: 22, body: 22 },
  layout: {
    headerAlignment: 'left',
    sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects'],
    sectionDivider: 'rule',
    headingUppercase: false,
  },
}
