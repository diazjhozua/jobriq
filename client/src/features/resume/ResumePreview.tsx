import { AlertCircle, Check, Minus } from 'lucide-react'
import type { EnhancedBullet, GeneratedResume } from '../../lib/types'

function Bullet({ bullet }: { bullet: EnhancedBullet }) {
  return (
    <li className="flex gap-2 text-[0.84rem] leading-6 text-body">
      <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden="true" />
      <span>
        {bullet.enhanced}
        {bullet.needsQuantification ? (
          <span
            title="Add a measurable number to strengthen this bullet."
            className="ml-2 inline-flex items-center gap-1 border border-border px-1.5 py-0.5 align-middle text-[0.68rem] text-muted"
          >
            <AlertCircle aria-hidden="true" size={11} />
            quantify
            <span className="sr-only">
              Add a measurable number to strengthen this bullet.
            </span>
          </span>
        ) : null}
      </span>
    </li>
  )
}

function KeywordChip({ keyword, matched }: { keyword: string; matched: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 border border-border bg-surface px-2 py-0.5 text-[0.72rem] text-body">
      {matched ? (
        <Check aria-hidden="true" size={11} className="text-primary" />
      ) : (
        <Minus aria-hidden="true" size={11} className="text-muted" />
      )}
      {keyword}
    </span>
  )
}

function SectionHeading({ children }: { children: string }) {
  return (
    <div>
      <h4 className="font-display text-[0.72rem] font-medium uppercase tracking-[0.16em]">
        {children}
      </h4>
      <div className="mt-1.5 border-t border-navy/15" aria-hidden="true" />
    </div>
  )
}

export function ResumePreview({ resume }: { resume: GeneratedResume }) {
  const contact = [resume.personal.email, resume.personal.phone, resume.personal.location]
    .filter(Boolean)
    .join('  |  ')
  const links = [
    resume.personal.linkedin,
    resume.personal.github,
    resume.personal.website,
  ]
    .filter(Boolean)
    .join('  |  ')

  return (
    <div className="space-y-6">
      <div className="border-b border-navy/20 pb-5">
        <h3 className="font-display text-[1.75rem] font-medium leading-tight">
          {resume.personal.name}
        </h3>
        {contact ? (
          <p className="mt-1.5 break-words text-[0.78rem] tracking-[0.01em] text-muted">
            {contact}
          </p>
        ) : null}
        {links ? (
          <p className="mt-1 break-all text-[0.78rem] tracking-[0.01em] text-muted">
            {links}
          </p>
        ) : null}
      </div>

      {resume.summary ? (
        <section>
          <SectionHeading>Professional summary</SectionHeading>
          <p className="mt-3 break-words text-[0.86rem] leading-6 text-body">
            {resume.summary}
          </p>
        </section>
      ) : null}

      {resume.experience.length > 0 ? (
        <section>
          <SectionHeading>Work experience</SectionHeading>
          <div className="mt-3 space-y-4">
            {resume.experience.map((experience) => (
              <div key={experience.id}>
                <p className="text-[0.86rem] font-medium text-navy">
                  {experience.title} — {experience.company}
                </p>
                <p className="text-[0.72rem] tabular-nums text-muted">
                  {experience.startDate} – {experience.endDate}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {experience.bullets.map((bullet, index) => (
                    <Bullet key={`${experience.id}-${index}`} bullet={bullet} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {resume.education.length > 0 ? (
        <section>
          <SectionHeading>Education</SectionHeading>
          <div className="mt-3 space-y-3">
            {resume.education.map((education) => (
              <div key={education.id}>
                <p className="text-[0.86rem] font-medium text-navy">
                  {education.degree} in {education.field} — {education.school}
                </p>
                <p className="text-[0.72rem] tabular-nums text-muted">
                  {education.startDate} – {education.endDate}
                </p>
                {education.gpa ? (
                  <p className="text-[0.72rem] text-muted">GPA: {education.gpa}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {resume.skills.length > 0 ? (
        <section>
          <SectionHeading>Skills</SectionHeading>
          <p className="mt-3 text-[0.86rem] leading-6 text-body">
            {resume.skills.join(', ')}
          </p>
        </section>
      ) : null}

      {resume.projects.length > 0 ? (
        <section>
          <SectionHeading>Projects</SectionHeading>
          <div className="mt-3 space-y-4">
            {resume.projects.map((project) => (
              <div key={project.id}>
                <p className="break-all text-[0.86rem] font-medium text-navy">
                  {project.name}
                  {project.url ? ` — ${project.url}` : ''}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {project.bullets.map((bullet, index) => (
                    <Bullet key={`${project.id}-${index}`} bullet={bullet} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {resume.keywords ? (
        <section>
          <SectionHeading>ATS keywords</SectionHeading>
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-[0.72rem] font-medium text-muted">
                Matched ({resume.keywords.matched.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {resume.keywords.matched.map((keyword) => (
                  <KeywordChip key={keyword} keyword={keyword} matched />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[0.72rem] font-medium text-muted">
                Missing ({resume.keywords.missing.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {resume.keywords.missing.map((keyword) => (
                  <KeywordChip key={keyword} keyword={keyword} matched={false} />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <p className="border-t border-border pt-3 text-[0.72rem] text-muted">
        Generated {new Date(resume.generatedAt).toLocaleString()}
      </p>
    </div>
  )
}
