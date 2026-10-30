import { Loader2, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field } from '../../components/ui/field'
import { Textarea } from '../../components/ui/textarea'
import type { Profile } from '../../lib/types'
import { useJobriq } from '../../providers/JobriqProvider'
import { EnhanceProfileNotice } from '../resume/EnhanceProfileNotice'
import { ResumeDialogContent } from '../resume/ResumeDialogContent'
import { useResumeDownload } from '../resume/useResumeDownload'

interface StandaloneResumeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  getProfile: () => Profile
}

export function StandaloneResumeDialog({
  open,
  onOpenChange,
  getProfile,
}: StandaloneResumeDialogProps) {
  const { standaloneResume, generateStandaloneResume } = useJobriq()
  const [drafting, setDrafting] = useState(standaloneResume === null)
  const [jobDescription, setJobDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const { downloading, downloadError, download, clearDownloadError } =
    useResumeDownload(standaloneResume)

  useEffect(() => {
    if (!open) {
      return
    }

    setDrafting(standaloneResume === null)
    setJobDescription('')
    setGenerating(false)
    setGenerateError(null)
    clearDownloadError()
  }, [open, standaloneResume, clearDownloadError])

  const handleGenerate = async () => {
    setGenerating(true)
    setGenerateError(null)
    clearDownloadError()

    try {
      await generateStandaloneResume(getProfile(), jobDescription)
      setDrafting(false)
    } catch (caught) {
      setGenerateError(
        caught instanceof Error ? caught.message : 'Resume generation failed.',
      )
    } finally {
      setGenerating(false)
    }
  }

  const openReview = () => {
    onOpenChange(false)
    window.requestAnimationFrame(() => {
      const review = document.getElementById('profile-review')
      review?.scrollIntoView({ block: 'start' })
      review?.focus()
    })
  }

  const resume = drafting ? null : standaloneResume

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Resume"
      description="Generate a resume from your profile without creating an application."
      className="max-w-2xl"
    >
      <ResumeDialogContent
        resume={resume}
        generating={generating}
        downloading={downloading}
        error={generateError ?? downloadError}
        emptyMessage="Generate a resume from your profile. Add a job description to match its keywords and tailor the result."
        notice={
          <EnhanceProfileNotice
            action={
              <button
                type="button"
                onClick={openReview}
                className="font-medium text-link underline-offset-4 hover:underline"
              >
                Open profile review
              </button>
            }
          >
            Run Profile review and apply its suggestions before generating. This
            resume reuses your saved profile.
          </EnhanceProfileNotice>
        }
        emptyContent={
          <Field
            label="Job description (optional)"
            htmlFor="standalone-job-description"
            hint="Leave blank to reuse your saved summary without keyword matching."
          >
            <Textarea
              id="standalone-job-description"
              rows={6}
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the job description to tailor the resume and match keywords."
            />
          </Field>
        }
        onDownload={(format) => void download(format)}
        actions={
          resume ? (
            <Button
              variant="outline"
              onClick={() => setDrafting(true)}
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
