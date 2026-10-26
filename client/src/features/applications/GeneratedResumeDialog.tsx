import { Download, Loader2, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { downloadResume, generateResume, type ExportFormat } from '../../lib/api'
import type { JobApplication } from '../../lib/types'
import { useJobriq } from '../../providers/JobriqProvider'
import { ResumePreview } from './ResumePreview'

interface GeneratedResumeDialogProps {
  application: JobApplication | null
  onOpenChange: (open: boolean) => void
}

export function GeneratedResumeDialog({
  application,
  onOpenChange,
}: GeneratedResumeDialogProps) {
  const { profile, saveGeneratedResume } = useJobriq()
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState<ExportFormat | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    setGenerating(false)
    setDownloading(null)
  }, [application?.id])

  if (!application) {
    return null
  }

  const resume = application.generatedResume ?? null

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)

    try {
      const generated = await generateResume(profile, application.jobDescription)
      await saveGeneratedResume(application.id, generated)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Resume generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async (format: ExportFormat) => {
    if (!resume) {
      return
    }

    setDownloading(format)
    setError(null)

    try {
      await downloadResume(resume, format)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The download failed.')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      title={`${application.role} at ${application.company}`}
      description="A resume tailored to this role's job description."
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {error ? (
          <div
            role="alert"
            className="rounded-md border border-border bg-canvas p-3 text-sm text-body"
          >
            {error}
          </div>
        ) : null}

        {generating ? (
          <div
            role="status"
            className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-md border border-border bg-canvas p-6 text-center"
          >
            <Loader2 aria-hidden="true" size={24} className="animate-spin text-brand-blue" />
            <p className="text-sm font-medium text-navy">Generating your resume</p>
            <p className="text-sm text-muted">
              Enhancing bullets, drafting the summary, and matching keywords.
            </p>
          </div>
        ) : resume ? (
          <ResumePreview resume={resume} />
        ) : (
          <div className="rounded-md border border-border bg-canvas p-6">
            <p className="text-sm text-body">
              Generate a resume from your saved profile and this job description. The result is
              saved with this application so you can come back to it.
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          {resume ? (
            <>
              <Button
                variant="outline"
                onClick={() => void handleDownload('markdown')}
                disabled={downloading !== null || generating}
              >
                {downloading === 'markdown' ? (
                  <Loader2 aria-hidden="true" size={16} className="animate-spin" />
                ) : (
                  <Download aria-hidden="true" size={16} />
                )}
                Markdown
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleDownload('docx')}
                disabled={downloading !== null || generating}
              >
                {downloading === 'docx' ? (
                  <Loader2 aria-hidden="true" size={16} className="animate-spin" />
                ) : (
                  <Download aria-hidden="true" size={16} />
                )}
                DOCX
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleGenerate()}
                disabled={generating || downloading !== null}
              >
                <Sparkles aria-hidden="true" size={16} />
                Regenerate
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => void handleGenerate()}
              disabled={generating}
            >
              <Sparkles aria-hidden="true" size={16} />
              Generate resume
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  )
}
