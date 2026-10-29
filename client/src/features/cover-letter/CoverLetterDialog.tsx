import { Check, Copy, Download, Loader2, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { formatCoverLetterText } from '../../lib/coverLetter'
import type { JobApplication } from '../../lib/types'
import { useCopyToClipboard } from '../../lib/useCopyToClipboard'
import { useJobriq } from '../../providers/JobriqProvider'
import { CoverLetterPreview } from './CoverLetterPreview'
import { useCoverLetterDownload } from './useCoverLetterDownload'

interface CoverLetterDialogProps {
  application: JobApplication | null
  onOpenChange: (open: boolean) => void
}

export function CoverLetterDialog({
  application,
  onOpenChange,
}: CoverLetterDialogProps) {
  const { generateCoverLetter } = useJobriq()
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const requestId = useRef(0)
  const letter = application?.coverLetter ?? null
  const { downloading, downloadError, download, reset: resetDownload } =
    useCoverLetterDownload(letter)
  const {
    copied,
    copyError,
    copy,
    reset: resetCopy,
  } = useCopyToClipboard('The cover letter could not be copied to the clipboard.')

  if (!application) {
    return null
  }

  const handleGenerate = async () => {
    const id = ++requestId.current
    setGenerating(true)
    setGenerateError(null)
    resetDownload()
    resetCopy()

    try {
      await generateCoverLetter(application.id)
    } catch (caught) {
      if (id === requestId.current) {
        setGenerateError(
          caught instanceof Error ? caught.message : 'Cover letter generation failed.',
        )
      }
    } finally {
      if (id === requestId.current) {
        setGenerating(false)
      }
    }
  }

  const error = generateError ?? downloadError ?? copyError

  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      title={`${application.role} at ${application.company}`}
      description="A cover letter written from your saved profile and this job description."
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {error ? (
          <div
            role="alert"
            className="border-l-2 border-accent bg-canvas px-3 py-2 text-[0.85rem] leading-6 text-body"
          >
            {error}
          </div>
        ) : null}

        {generating ? (
          <div
            role="status"
            className="flex min-h-40 flex-col items-start justify-center gap-2 border-y border-border py-10"
          >
            <Loader2 aria-hidden="true" size={20} className="animate-spin text-primary" />
            <p className="font-display text-lg text-navy">Writing your cover letter</p>
            <p className="text-[0.85rem] text-muted">
              Connecting your experience to this role and its job description.
            </p>
          </div>
        ) : letter ? (
          <CoverLetterPreview letter={letter} />
        ) : (
          <div className="border-y border-border py-6">
            <p className="text-[0.85rem] leading-6 text-body">
              Write a cover letter from your saved profile and this job description. The
              result is saved with this application so you can come back to it.
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5">
          {letter ? (
            <>
              <Button
                variant="outline"
                onClick={() => void copy(formatCoverLetterText(letter))}
                disabled={generating || downloading}
              >
                {copied ? (
                  <Check aria-hidden="true" size={15} className="text-primary" />
                ) : (
                  <Copy aria-hidden="true" size={15} />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                onClick={() => void download()}
                disabled={generating || downloading}
              >
                {downloading ? (
                  <Loader2 aria-hidden="true" size={15} className="animate-spin" />
                ) : (
                  <Download aria-hidden="true" size={15} />
                )}
                Download DOCX
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleGenerate()}
                disabled={generating || downloading}
              >
                <Sparkles aria-hidden="true" size={15} />
                Regenerate
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => void handleGenerate()}
              disabled={generating}
            >
              {generating ? (
                <Loader2 aria-hidden="true" size={16} className="animate-spin" />
              ) : (
                <Sparkles aria-hidden="true" size={16} />
              )}
              Write cover letter
            </Button>
          )}
          <span role="status" className="sr-only">
            {copied ? 'Cover letter copied to the clipboard.' : ''}
          </span>
        </div>
      </div>
    </Dialog>
  )
}
