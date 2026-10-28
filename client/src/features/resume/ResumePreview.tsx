import { AlertCircle, Check, Minus } from 'lucide-react'
import type { EnhancedBullet, GeneratedResume } from '../../lib/types'

function Bullet({ bullet }: { bullet: EnhancedBullet }) {
  return (
    <li className="flex gap-2 text-sm text-body">
      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden="true" />
      <span>
        {bullet.enhanced}
        {bullet.needsQuantification ? (
          <span
            title="Add a measurable number to strengthen this bullet."
            className="ml-2 inline-flex items-center gap-1 rounded bg-canvas px-1.5 py-0.5 align-middle text-xs text-muted"
          >
            <AlertCircle aria-hidden="true" size={12} />
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
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-canvas px-2.5 py-1 text-xs text-body">
      {matched ? (
        <Check aria-hidden="true" size={12} className="text-brand-blue" />
      ) : (
        <Minus aria-hidden="true" size={12} className="text-muted" />
      )}
      {keyword}
    </span>
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
      <div className="border-b border-border pb-4">
        <h3 className="text-xl font-semibold">{resume.personal.name}</h3>
        {contact ? (
          <p className="mt-1 break-words text-sm text-muted">{contact}</p>
        ) : null}
        {links ? <p className="mt-1 break-all text-sm text-muted">{links}</p> : null}
      </div>

      {resume.summary ? (
        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wide">Professional summary</h4>
          <div className="mt-2 h-0.5 w-8 bg-accent" aria-hidden="true" />
          <p className="mt-3 break-words text-sm text-body">{resume.summary}</p>
        </section>
      ) : null}

      {resume.experience.length > 0 ? (
        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wide">Work experience</h4>
          <div className="mt-2 h-0.5 w-8 bg-accent" aria-hidden="true" />
          <div className="mt-3 space-y-4">
            {resume.experience.map((experience) => (
              <div key={experience.id}>
                <p className="text-sm font-semibold text-navy">
                  {experience.title} — {experience.company}
                </p>
                <p className="text-xs text-muted">
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
          <h4 className="text-sm font-semibold uppercase tracking-wide">Education</h4>
          <div className="mt-2 h-0.5 w-8 bg-accent" aria-hidden="true" />
          <div className="mt-3 space-y-3">
            {resume.education.map((education) => (
              <div key={education.id}>
                <p className="text-sm font-semibold text-navy">
                  {education.degree} in {education.field} — {education.school}
                </p>
                <p className="text-xs text-muted">
                  {education.startDate} – {education.endDate}
                </p>
                {education.gpa ? (
                  <p className="text-xs text-muted">GPA: {education.gpa}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {resume.skills.length > 0 ? (
        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wide">Skills</h4>
          <div className="mt-2 h-0.5 w-8 bg-accent" aria-hidden="true" />
          <p className="mt-3 text-sm text-body">{resume.skills.join(', ')}</p>
        </section>
      ) : null}

      {resume.projects.length > 0 ? (
        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wide">Projects</h4>
          <div className="mt-2 h-0.5 w-8 bg-accent" aria-hidden="true" />
          <div className="mt-3 space-y-4">
            {resume.projects.map((project) => (
              <div key={project.id}>
                <p className="break-all text-sm font-semibold text-navy">
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
          <h4 className="text-sm font-semibold uppercase tracking-wide">ATS keywords</h4>
          <div className="mt-2 h-0.5 w-8 bg-accent" aria-hidden="true" />
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs font-medium text-muted">
                Matched ({resume.keywords.matched.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {resume.keywords.matched.map((keyword) => (
                  <KeywordChip key={keyword} keyword={keyword} matched />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">
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

      <p className="text-xs text-muted">
        Generated {new Date(resume.generatedAt).toLocaleString()}
      </p>
    </div>
  )
}
