import type { ResumeTheme } from '../types/theme.js'

export const theme: ResumeTheme = {
  name: 'harvard',
  font: 'Times New Roman',
  colors: { text: '000000', accent: '000000', muted: '000000', rule: '000000' },
  sizes: { name: 32, heading: 24, subheading: 22, body: 22 },
  layout: {
    headerAlignment: 'left',
    sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects'],
    sectionDivider: 'underline',
    headingUppercase: true,
  },
}
