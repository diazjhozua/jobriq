import { Check, Minus } from 'lucide-react'
import type { EnhancedBullet, GeneratedResume } from '../../lib/types'
import { DocumentHeader } from '../documents/DocumentHeader'

function Bullet({ bullet }: { bullet: EnhancedBullet }) {
  return (
    <li className="flex gap-2 text-[0.84rem] leading-6 text-body">
      <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden="true" />
      <span>{bullet.enhanced}</span>
    </li>
  )
}

function KeywordChip({ keyword, matched }: { keyword: string; matched: boolean }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 break-words border border-border bg-surface px-2 py-0.5 text-[0.72rem] text-body [overflow-wrap:anywhere]">
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
  return (
    <div className="space-y-6">
      <DocumentHeader personal={resume.personal} />

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
                <p className="break-words text-[0.86rem] font-medium text-navy">
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
                <p className="break-words text-[0.86rem] font-medium text-navy">
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
                <p className="break-words text-[0.86rem] font-medium text-navy [overflow-wrap:anywhere]">
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
