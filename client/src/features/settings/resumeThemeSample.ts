export interface ResumeThemeSampleEntry {
  title: string
  // Dates that sit on the title line, as the DOCX does for experience and
  // education.
  inlineMeta?: string
  // Metadata that gets its own muted line, as the DOCX does for
  // certifications, awards, and projects.
  meta?: string
  body?: string
  bodyTone?: 'text' | 'muted'
  bullets?: string[]
}

export interface ResumeThemeSampleSection {
  heading: string
  text?: string
  entries?: ResumeThemeSampleEntry[]
}

export interface ResumeThemeSample {
  name: string
  contact: string[]
  links: string[]
  sections: ResumeThemeSampleSection[]
}

// Static content for the theme preview. It mirrors the DOCX section order in
// DocxResumeExporter and is deliberately concise so it fits one Letter page at
// the built-in theme sizes. It is view data, not an API contract.
export const RESUME_THEME_SAMPLE: ResumeThemeSample = {
  name: 'Jane Doe',
  contact: ['jane.doe@example.com', '(555) 123-4567', 'Portland, OR'],
  links: [
    'linkedin.com/in/janedoe',
    'github.com/janedoe',
    'janedoe.dev',
  ],
  sections: [
    {
      heading: 'Professional Summary',
      text: 'Senior software engineer building accessible web applications and reliable backend services.',
    },
    {
      heading: 'Work Experience',
      entries: [
        {
          title: 'Senior Software Engineer — Acme',
          inlineMeta: 'Mar 2021 – Present',
          bullets: [
            'Rebuilt the customer dashboard in React and TypeScript, cutting load time by 38%.',
            'Mentored four engineers and set a testing standard that cut regressions by a third.',
          ],
        },
        {
          title: 'Software Engineer — Northwind',
          inlineMeta: 'Jun 2017 – Feb 2021',
          bullets: [
            'Built .NET services for order processing and shipped a PostgreSQL audit trail.',
            'Brought the checkout flow to WCAG 2.1 AA with the design team.',
          ],
        },
      ],
    },
    {
      heading: 'Education',
      entries: [
        {
          title: 'B.S. in Computer Science — University of Oregon',
          inlineMeta: '2013 – 2017',
          body: 'GPA: 3.8',
          bodyTone: 'muted',
        },
      ],
    },
    {
      heading: 'Licenses & Certifications',
      entries: [
        {
          title: 'AWS Certified Solutions Architect — Amazon Web Services',
          meta: 'Mar 2023 – Mar 2026 · Credential ID: AWS-12345',
        },
      ],
    },
    {
      heading: 'Honors & Awards',
      entries: [
        {
          title: 'Engineering Excellence Award — Acme',
          meta: '2022 · Acme',
        },
      ],
    },
    {
      heading: 'Skills',
      text: 'TypeScript, React, C#, .NET, PostgreSQL, Docker, AWS, Accessibility',
    },
    {
      heading: 'Projects',
      entries: [
        {
          title: 'Jobriq — github.com/janedoe/jobriq',
          meta: '2024 · Personal Project',
          bullets: [
            'Tracks applications and generates tailored resumes with OpenAI.',
          ],
        },
      ],
    },
  ],
}
