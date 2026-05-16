import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  UnderlineType,
  type IRunOptions,
} from 'docx'
import type { Resume } from '../types/resume.js'
import type { ResumeTheme, SectionName } from '../types/theme.js'
import { classic } from '../themes/index.js'

export async function toDocx(resume: Resume, theme: ResumeTheme = classic): Promise<Buffer> {
  const sectionBuilders: Record<SectionName, () => Paragraph[]> = {
    summary:    () => summarySection(resume, theme),
    experience: () => experienceSection(resume, theme),
    education:  () => educationSection(resume, theme),
    skills:     () => skillsSection(resume, theme),
    projects:   () => projectsSection(resume, theme),
  }

  const children: Paragraph[] = [
    ...headerSection(resume, theme),
    ...theme.layout.sectionOrder.flatMap((s) => sectionBuilders[s]()),
  ]

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: theme.font, size: theme.sizes.body, color: theme.colors.text },
        },
      },
    },
    sections: [{ children }],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}

// ── Section builders ─────────────────────────────────────────────────────────

function headerSection(resume: Resume, theme: ResumeTheme): Paragraph[] {
  const paras: Paragraph[] = []
  const alignment =
    theme.layout.headerAlignment === 'left' ? AlignmentType.LEFT : AlignmentType.CENTER

  paras.push(
    new Paragraph({
      alignment,
      children: [
        new TextRun({
          text: resume.personal.name,
          bold: true,
          size: theme.sizes.name,
          font: theme.font,
          color: theme.colors.accent,
        }),
      ],
      spacing: { after: 80 },
    })
  )

  const contact = [resume.personal.email, resume.personal.phone, resume.personal.location]
    .filter(Boolean)
    .join('  |  ')
  if (contact) {
    paras.push(
      new Paragraph({
        alignment,
        children: [run(contact, theme, { size: theme.sizes.body - 2, color: theme.colors.muted })],
        spacing: { after: 60 },
      })
    )
  }

  const links = [resume.personal.linkedin, resume.personal.github, resume.personal.website]
    .filter(Boolean)
    .join('  |  ')
  if (links) {
    paras.push(
      new Paragraph({
        alignment,
        children: [run(links, theme, { size: theme.sizes.body - 2, color: theme.colors.muted })],
        spacing: { after: 160 },
      })
    )
  }

  return paras
}

function summarySection(resume: Resume, theme: ResumeTheme): Paragraph[] {
  if (!resume.summary) return []
  return [
    ...sectionDivider('Professional Summary', theme),
    new Paragraph({
      children: [run(resume.summary, theme)],
      spacing: { after: 200 },
    }),
  ]
}

function experienceSection(resume: Resume, theme: ResumeTheme): Paragraph[] {
  const active = resume.experience.filter((e) => e.company || e.title || e.bullets.length > 0)
  if (active.length === 0) return []

  const paras: Paragraph[] = [...sectionDivider('Work Experience', theme)]

  for (const exp of active) {
    paras.push(
      new Paragraph({
        children: [
          run(`${exp.title} — ${exp.company}`, theme, { bold: true }),
          run(`   ${exp.startDate} – ${exp.endDate}`, theme, {
            color: theme.colors.muted,
            size: theme.sizes.body - 2,
          }),
        ],
        spacing: { before: 160, after: 60 },
      })
    )

    const bullets = exp.enhancedBullets?.map((b) => b.enhanced) ?? exp.bullets
    for (const b of bullets) {
      paras.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [run(b, theme)],
          spacing: { after: 40 },
        })
      )
    }
  }

  return paras
}

function educationSection(resume: Resume, theme: ResumeTheme): Paragraph[] {
  const active = resume.education.filter((e) => e.school || e.degree)
  if (active.length === 0) return []

  const paras: Paragraph[] = [...sectionDivider('Education', theme)]

  for (const edu of active) {
    paras.push(
      new Paragraph({
        children: [
          run(`${edu.degree} in ${edu.field} — ${edu.school}`, theme, { bold: true }),
          run(`   ${edu.startDate} – ${edu.endDate}`, theme, {
            color: theme.colors.muted,
            size: theme.sizes.body - 2,
          }),
        ],
        spacing: { before: 160, after: 60 },
      })
    )
    if (edu.gpa) {
      paras.push(
        new Paragraph({
          children: [run(`GPA: ${edu.gpa}`, theme, { color: theme.colors.muted })],
          spacing: { after: 60 },
        })
      )
    }
  }

  return paras
}

function skillsSection(resume: Resume, theme: ResumeTheme): Paragraph[] {
  if (resume.skills.length === 0) return []
  return [
    ...sectionDivider('Skills', theme),
    new Paragraph({
      children: [run(resume.skills.join(', '), theme)],
      spacing: { after: 200 },
    }),
  ]
}

function projectsSection(resume: Resume, theme: ResumeTheme): Paragraph[] {
  const active = resume.projects.filter((p) => p.name && p.bullets.length > 0)
  if (active.length === 0) return []

  const paras: Paragraph[] = [...sectionDivider('Projects', theme)]

  for (const proj of active) {
    const header = proj.url ? `${proj.name} — ${proj.url}` : proj.name
    paras.push(
      new Paragraph({
        children: [run(header, theme, { bold: true })],
        spacing: { before: 160, after: 60 },
      })
    )
    const bullets = proj.enhancedBullets?.map((b) => b.enhanced) ?? proj.bullets
    for (const b of bullets) {
      paras.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [run(b, theme)],
          spacing: { after: 40 },
        })
      )
    }
  }

  return paras
}

// ── Primitives ───────────────────────────────────────────────────────────────

function run(text: string, theme: ResumeTheme, opts: IRunOptions = {}): TextRun {
  return new TextRun({ text, font: theme.font, size: theme.sizes.body, color: theme.colors.text, ...opts })
}

function sectionDivider(text: string, theme: ResumeTheme): Paragraph[] {
  const label = theme.layout.headingUppercase ? text.toUpperCase() : text

  if (theme.layout.sectionDivider === 'underline') {
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: label,
            bold: true,
            size: theme.sizes.heading,
            font: theme.font,
            color: theme.colors.accent,
            underline: { type: UnderlineType.SINGLE, color: theme.colors.accent },
          }),
        ],
        spacing: { before: 240, after: 120 },
      }),
    ]
  }

  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: label,
          bold: true,
          size: theme.sizes.heading,
          font: theme.font,
          color: theme.colors.accent,
        }),
      ],
      spacing: { before: 240, after: 60 },
    }),
    new Paragraph({
      border: {
        bottom: { color: theme.colors.rule, space: 1, style: BorderStyle.SINGLE, size: 4 },
      },
      spacing: { after: 120 },
      children: [],
    }),
  ]
}
