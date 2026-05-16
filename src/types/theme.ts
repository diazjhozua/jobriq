export type SectionName = 'summary' | 'experience' | 'education' | 'skills' | 'projects'

export interface ResumeTheme {
  name: string
  font: string
  colors: {
    text: string
    accent: string
    muted: string
    rule: string
  }
  sizes: {
    name: number
    heading: number
    subheading: number
    body: number
  }
  layout: {
    headerAlignment: 'center' | 'left'
    sectionOrder: SectionName[]
    sectionDivider: 'rule' | 'underline'
    headingUppercase: boolean
  }
}
