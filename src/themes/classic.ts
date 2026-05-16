import type { ResumeTheme } from '../types/theme.js'

export const theme: ResumeTheme = {
  name: 'classic',
  font: 'Calibri',
  colors: { text: '1A1A1A', accent: '1A1A1A', muted: '666666', rule: 'CCCCCC' },
  sizes: { name: 36, heading: 26, subheading: 22, body: 22 },
  layout: {
    headerAlignment: 'center',
    sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects'],
    sectionDivider: 'rule',
    headingUppercase: false,
  },
}
