import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field } from '../../components/ui/field'
import { Textarea } from '../../components/ui/textarea'
import { profileSchema } from '../../lib/schemas'
import { parseResumeTemplate } from '../../lib/template'
import type { Profile } from '../../lib/types'

interface TemplateImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: (profile: Profile) => void
}

export function TemplateImportDialog({
  open,
  onOpenChange,
  onImported,
}: TemplateImportDialogProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const close = (next: boolean) => {
    if (!next) {
      setText('')
      setError(null)
    }

    onOpenChange(next)
  }

  const handleImport = () => {
    if (!text.trim()) {
      setError('Paste your resume template first.')
      return
    }

    try {
      const parsed = profileSchema.safeParse(parseResumeTemplate(text))
      if (!parsed.success) {
        const issue = parsed.error.issues[0]
        setError(`${issue.path.join('.')}: ${issue.message}`)
        return
      }

      onImported(parsed.data)
      close(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not read the template.')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="Import resume template"
      description="Paste the contents of resumes/my-resume.txt. This replaces your current profile."
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <Field
          label="Template text"
          htmlFor="template-text"
          hint="Sections [PERSONAL], [SUMMARY], [EXPERIENCE], [EDUCATION], [SKILLS], and [PROJECT] are imported."
          error={error ?? undefined}
        >
          <Textarea
            id="template-text"
            rows={14}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={'[PERSONAL]\nName: Jane Doe\nEmail: jane@example.com\n...'}
            className="font-mono text-xs"
          />
        </Field>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleImport}>
            Import profile
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
