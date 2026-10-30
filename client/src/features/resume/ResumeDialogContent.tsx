import { Download, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../../components/ui/button'
import type { ExportFormat } from '../../lib/api'
import type { GeneratedResume } from '../../lib/types'
import { ResumePreview } from './ResumePreview'

interface ResumeDialogContentProps {
  resume: GeneratedResume | null
  generating: boolean
  downloading: ExportFormat | null
  error: string | null
  emptyMessage: string
  notice?: ReactNode
  emptyContent?: ReactNode
  onDownload: (format: ExportFormat) => void
  actions: ReactNode
}

export function ResumeDialogContent({
  resume,
  generating,
  downloading,
  error,
  emptyMessage,
  notice,
  emptyContent,
  onDownload,
  actions,
}: ResumeDialogContentProps) {
  return (
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
          <p className="font-display text-lg text-navy">Generating your resume</p>
          <p className="text-[0.85rem] text-muted">
            Enhancing bullets, drafting the summary, and matching keywords.
          </p>
        </div>
      ) : resume ? (
        <ResumePreview resume={resume} />
      ) : (
        <div className="space-y-4 border-y border-border py-6">
          {notice}
          <p className="text-[0.85rem] leading-6 text-body">{emptyMessage}</p>
          {emptyContent}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5">
        {resume ? (
          <>
            <Button
              variant="outline"
              onClick={() => onDownload('markdown')}
              disabled={downloading !== null || generating}
            >
              {downloading === 'markdown' ? (
                <Loader2 aria-hidden="true" size={15} className="animate-spin" />
              ) : (
                <Download aria-hidden="true" size={15} />
              )}
              Download Markdown
            </Button>
            <Button
              variant="outline"
              onClick={() => onDownload('docx')}
              disabled={downloading !== null || generating}
            >
              {downloading === 'docx' ? (
                <Loader2 aria-hidden="true" size={15} className="animate-spin" />
              ) : (
                <Download aria-hidden="true" size={15} />
              )}
              Download DOCX
            </Button>
          </>
        ) : null}
        {actions}
      </div>
    </div>
  )
}
