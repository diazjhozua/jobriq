import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ConfirmDialog } from '../../components/ui/alert-dialog'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import type { PromptStyle } from '../../lib/types'
import { useJobriq } from '../../providers/JobriqProvider'
import { PromptStyleDialog } from './PromptStyleDialog'

function focusById(id: string) {
  requestAnimationFrame(() => {
    document.getElementById(id)?.focus()
  })
}

function ActiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 border border-primary/40 bg-primary/5 px-1.5 py-0.5 text-[0.7rem] font-medium text-primary">
      <Check aria-hidden="true" size={11} />
      Active
    </span>
  )
}

export function SettingsPage() {
  const {
    promptStyles,
    activatePromptStyle,
    deletePromptStyle,
  } = useJobriq()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PromptStyle | null>(null)
  const [deleting, setDeleting] = useState<PromptStyle | null>(null)

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (style: PromptStyle) => {
    setEditing(style)
    setDialogOpen(true)
  }

  const handleActivate = (id: string) => {
    void activatePromptStyle(id)
      .then(() => {
        focusById(`prompt-style-title-${id}`)
      })
      .catch(() => {
        // The provider surfaces the error in the sync banner.
      })
  }

  const handleDelete = () => {
    if (!deleting) {
      return
    }

    const id = deleting.id
    setDeleting(null)

    void deletePromptStyle(id)
      .then(() => {
        focusById('saved-styles-title')
      })
      .catch(() => {
        // The provider surfaces the error in the sync banner.
      })
  }

  const baseline = promptStyles.baseline
  const styles = promptStyles.styles

  return (
    <div className="space-y-10">
      <PageHeader
        title="Settings"
        description="Choose the voice Jobriq uses when it writes your resume bullets, summaries, and cover letters."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus aria-hidden="true" size={15} />
            New prompt style
          </Button>
        }
      />

      <section
        aria-labelledby="baseline-title"
        className="grid gap-5 border-t border-border pt-8 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-10"
      >
        <div>
          <h2
            id="baseline-title"
            className="text-[1.3rem] font-medium leading-tight"
          >
            Built-in baseline
          </h2>
          <p className="mt-2 max-w-[32ch] text-[0.8rem] leading-5 text-muted">
            The default voice. It ships with Jobriq and cannot be edited or
            deleted.
          </p>
        </div>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 className="break-words text-[1rem] font-medium">{baseline.name}</h3>
            {promptStyles.activeStyleId === null ? <ActiveBadge /> : null}
            <span className="text-[0.75rem] text-muted">Read-only</span>
          </div>
          <p className="mt-3 max-w-[62ch] whitespace-pre-line break-words text-[0.88rem] leading-6 text-body">
            {baseline.instructions ||
              'Jobriq writes in a plain, professional voice and uses only the details you already wrote.'}
          </p>
          {promptStyles.activeStyleId !== null ? (
            <p className="mt-4 max-w-[62ch] text-[0.8rem] leading-5 text-muted">
              A saved style is active. Delete the active style to fall back to
              the baseline.
            </p>
          ) : null}
        </Card>
      </section>

      <section
        aria-labelledby="saved-styles-title"
        className="grid gap-5 border-t border-border pt-8 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-10"
      >
        <div>
          <h2
            id="saved-styles-title"
            tabIndex={-1}
            className="text-[1.3rem] font-medium leading-tight"
          >
            Your styles
          </h2>
          <p className="mt-2 max-w-[32ch] text-[0.8rem] leading-5 text-muted">
            One style is active at a time and applies to every generation.
          </p>
        </div>

        <div>
          {styles.length === 0 ? (
            <div className="border-y border-border py-10">
              <h3 className="text-[1.1rem] font-medium">No saved styles yet</h3>
              <p className="mt-2 max-w-[48ch] text-[0.88rem] leading-6 text-muted">
                Save a style to change how Jobriq sounds. The built-in baseline
                stays available.
              </p>
              <Button variant="outline" className="mt-5" onClick={openCreate}>
                <Plus aria-hidden="true" size={15} />
                Create your first style
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {styles.map((style) => {
                const isActive = style.id === promptStyles.activeStyleId

                return (
                  <li key={style.id} className="py-5">
                    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <h3
                            id={`prompt-style-title-${style.id}`}
                            tabIndex={-1}
                            className="break-words text-[1rem] font-medium"
                          >
                            {style.name}
                          </h3>
                          {isActive ? <ActiveBadge /> : null}
                        </div>
                        <p className="mt-2 max-w-[62ch] whitespace-pre-line break-words text-[0.85rem] leading-6 text-muted">
                          {style.instructions}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-1">
                        {isActive ? null : (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Set active ${style.name}`}
                            onClick={() => handleActivate(style.id)}
                          >
                            Set active
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Edit ${style.name}`}
                          onClick={() => openEdit(style)}
                        >
                          <Pencil aria-hidden="true" size={14} />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Delete ${style.name}`}
                          onClick={() => setDeleting(style)}
                        >
                          <Trash2 aria-hidden="true" size={14} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <PromptStyleDialog
        key={dialogOpen ? (editing?.id ?? 'new') : 'closed'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        style={editing}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null)
          }
        }}
        title="Delete prompt style"
        description={
          deleting
            ? `Delete “${deleting.name}”? Jobriq falls back to the built-in baseline if this style is active.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  )
}
