import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  type IRunOptions,
} from 'docx'
import type { Resume } from '../types/resume.js'

const FONT = 'Calibri'
const COLOR_TEXT = '1A1A1A'
const COLOR_MUTED = '666666'
const COLOR_RULE = 'CCCCCC'

export async function toDocx(resume: Resume): Promise<Buffer> {
  const children: Paragraph[] = [
    ...headerSection(resume),
    ...summarySection(resume),
    ...experienceSection(resume),
    ...educationSection(resume),
    ...skillsSection(resume),
    ...projectsSection(resume),
  ]

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22, color: COLOR_TEXT },
        },
      },
    },
    sections: [{ children }],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}

// ── Section builders ─────────────────────────────────────────────────────────

function headerSection(resume: Resume): Paragraph[] {
  const paras: Paragraph[] = []

  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: resume.personal.name, bold: true, size: 36, font: FONT })],
      spacing: { after: 80 },
    })
  )

  const contact = [resume.personal.email, resume.personal.phone, resume.personal.location]
    .filter(Boolean)
    .join('  |  ')
  if (contact) {
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [run(contact, { size: 20, color: COLOR_MUTED })],
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
        alignment: AlignmentType.CENTER,
        children: [run(links, { size: 20, color: COLOR_MUTED })],
        spacing: { after: 160 },
      })
    )
  }

  return paras
}

function summarySection(resume: Resume): Paragraph[] {
  if (!resume.summary) return []
  return [
    sectionHeading('Professional Summary'),
    rule(),
    new Paragraph({
      children: [run(resume.summary)],
      spacing: { after: 200 },
    }),
  ]
}

function experienceSection(resume: Resume): Paragraph[] {
  const active = resume.experience.filter((e) => e.company || e.title || e.bullets.length > 0)
  if (active.length === 0) return []

  const paras: Paragraph[] = [sectionHeading('Work Experience'), rule()]

  for (const exp of active) {
    paras.push(
      new Paragraph({
        children: [
          run(`${exp.title} — ${exp.company}`, { bold: true }),
          run(`   ${exp.startDate} – ${exp.endDate}`, { color: COLOR_MUTED, size: 20 }),
        ],
        spacing: { before: 160, after: 60 },
      })
    )

    const bullets = exp.enhancedBullets?.map((b) => b.enhanced) ?? exp.bullets
    for (const b of bullets) {
      paras.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [run(b)],
          spacing: { after: 40 },
        })
      )
    }
  }

  return paras
}

function educationSection(resume: Resume): Paragraph[] {
  const active = resume.education.filter((e) => e.school || e.degree)
  if (active.length === 0) return []

  const paras: Paragraph[] = [sectionHeading('Education'), rule()]

  for (const edu of active) {
    paras.push(
      new Paragraph({
        children: [
          run(`${edu.degree} in ${edu.field} — ${edu.school}`, { bold: true }),
          run(`   ${edu.startDate} – ${edu.endDate}`, { color: COLOR_MUTED, size: 20 }),
        ],
        spacing: { before: 160, after: 60 },
      })
    )
    if (edu.gpa) {
      paras.push(
        new Paragraph({
          children: [run(`GPA: ${edu.gpa}`, { color: COLOR_MUTED })],
          spacing: { after: 60 },
        })
      )
    }
  }

  return paras
}

function skillsSection(resume: Resume): Paragraph[] {
  if (resume.skills.length === 0) return []
  return [
    sectionHeading('Skills'),
    rule(),
    new Paragraph({
      children: [run(resume.skills.join(', '))],
      spacing: { after: 200 },
    }),
  ]
}

function projectsSection(resume: Resume): Paragraph[] {
  const active = resume.projects.filter((p) => p.name && p.bullets.length > 0)
  if (active.length === 0) return []

  const paras: Paragraph[] = [sectionHeading('Projects'), rule()]

  for (const proj of active) {
    const header = proj.url ? `${proj.name} — ${proj.url}` : proj.name
    paras.push(
      new Paragraph({
        children: [run(header, { bold: true })],
        spacing: { before: 160, after: 60 },
      })
    )
    for (const b of proj.bullets) {
      paras.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [run(b)],
          spacing: { after: 40 },
        })
      )
    }
  }

  return paras
}

// ── Primitives ───────────────────────────────────────────────────────────────

function run(text: string, opts: IRunOptions = {}): TextRun {
  return new TextRun({ text, font: FONT, size: 22, ...opts })
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26, font: FONT, color: COLOR_TEXT })],
    spacing: { before: 240, after: 60 },
  })
}

function rule(): Paragraph {
  return new Paragraph({
    border: {
      bottom: { color: COLOR_RULE, space: 1, style: BorderStyle.SINGLE, size: 4 },
    },
    spacing: { after: 120 },
    children: [],
  })
}
