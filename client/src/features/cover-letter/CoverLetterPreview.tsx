import type { CoverLetter } from '../../lib/types'
import { formatCoverLetterDate } from '../../lib/coverLetter'
import { DocumentHeader } from '../documents/DocumentHeader'

export function CoverLetterPreview({ letter }: { letter: CoverLetter }) {
  const date = formatCoverLetterDate(letter.generatedAt)

  return (
    <div className="space-y-5">
      <DocumentHeader personal={letter.personal} />

      {date ? (
        <p className="text-[0.78rem] tracking-[0.01em] text-muted">{date}</p>
      ) : null}

      <div className="space-y-4 text-[0.86rem] leading-6 text-body">
        <p>{letter.salutation}</p>
        {letter.paragraphs.map((paragraph, index) => (
          <p key={index} className="break-words">
            {paragraph}
          </p>
        ))}
        <div className="pt-1">
          <p>{letter.closing}</p>
          <p className="mt-3 font-medium text-navy">{letter.signature}</p>
        </div>
      </div>
    </div>
  )
}
