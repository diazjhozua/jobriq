import { Loader2, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { generateResume } from '../../lib/api'
import type { JobApplication } from '../../lib/types'
import { useJobriq } from '../../providers/JobriqProvider'
import { EnhanceProfileNotice } from '../resume/EnhanceProfileNotice'
import { ResumeDialogContent } from '../resume/ResumeDialogContent'
import { useResumeDownload } from '../resume/useResumeDownload'

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
  const [generateError, setGenerateError] = useState<string | null>(null)
  const resume = application?.generatedResume ?? null
  const { downloading, downloadError, download, clearDownloadError } =
    useResumeDownload(resume)

  useEffect(() => {
    setGenerateError(null)
    setGenerating(false)
    clearDownloadError()
  }, [application?.id, clearDownloadError])

  if (!application) {
    return null
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setGenerateError(null)
    clearDownloadError()

    try {
      const generated = await generateResume(profile, application.jobDescription)
      await saveGeneratedResume(application.id, generated)
    } catch (caught) {
      setGenerateError(
        caught instanceof Error ? caught.message : 'Resume generation failed.',
      )
    } finally {
      setGenerating(false)
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
      <ResumeDialogContent
        resume={resume}
        generating={generating}
        downloading={downloading}
        error={generateError ?? downloadError}
        emptyMessage="Generate a resume from your saved profile and this job description. The result is saved with this application so you can come back to it."
        notice={
          <EnhanceProfileNotice
            action={
              <Link
                to="/profile#profile-review"
                className="font-medium text-link underline-offset-4 hover:underline"
              >
                Open profile review
              </Link>
            }
          >
            Run Profile review and apply its suggestions before generating. This
            resume reuses your saved profile, so polished bullets carry straight
            into it.
          </EnhanceProfileNotice>
        }
        onDownload={(format) => void download(format)}
        actions={
          resume ? (
            <Button
              variant="outline"
              onClick={() => void handleGenerate()}
              disabled={generating || downloading !== null}
            >
              <Sparkles aria-hidden="true" size={16} />
              Regenerate
            </Button>
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
              Generate resume
            </Button>
          )
        }
      />
    </Dialog>
  )
}
