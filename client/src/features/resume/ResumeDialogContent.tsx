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
  emptyContent,
  onDownload,
  actions,
}: ResumeDialogContentProps) {
  return (
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
          {emptyContent ?? <p className="text-sm text-body">{emptyMessage}</p>}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        {resume ? (
          <>
            <Button
              variant="outline"
              onClick={() => onDownload('markdown')}
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
              onClick={() => onDownload('docx')}
              disabled={downloading !== null || generating}
            >
              {downloading === 'docx' ? (
                <Loader2 aria-hidden="true" size={16} className="animate-spin" />
              ) : (
                <Download aria-hidden="true" size={16} />
              )}
              DOCX
            </Button>
          </>
        ) : null}
        {actions}
      </div>
    </div>
  )
}
