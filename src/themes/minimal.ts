import type { ResumeTheme } from '../types/theme.js'

export const theme: ResumeTheme = {
  name: 'minimal',
  font: 'Arial',
  colors: { text: '333333', accent: '333333', muted: '888888', rule: 'DDDDDD' },
  sizes: { name: 32, heading: 24, subheading: 21, body: 21 },
  layout: {
    headerAlignment: 'left',
    sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects'],
    sectionDivider: 'rule',
    headingUppercase: false,
  },
}
