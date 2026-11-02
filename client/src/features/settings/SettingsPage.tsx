import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ActiveBadge } from '../../components/ui/active-badge'
import { ConfirmDialog } from '../../components/ui/alert-dialog'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import type { PromptStyle, ResumeTheme } from '../../lib/types'
import { useJobriq } from '../../providers/JobriqProvider'
import { PromptStyleDialog } from './PromptStyleDialog'
import { ResumeThemeDialog } from './ResumeThemeDialog'
import { ResumeThemePreview } from './ResumeThemePreview'

function focusById(id: string) {
  requestAnimationFrame(() => {
    document.getElementById(id)?.focus()
  })
}

interface ThemeCardProps {
  theme: ResumeTheme
  titleId?: string
  onActivate?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

function ThemeCard({ theme, titleId, onActivate, onEdit, onDelete }: ThemeCardProps) {
  return (
    <li className="flex flex-col">
      <ResumeThemePreview styles={theme.styles} />

      <div className="mt-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <h3
            id={titleId}
            tabIndex={titleId ? -1 : undefined}
            className="break-words text-[0.95rem] font-medium"
          >
            {theme.name}
          </h3>
          {theme.isActive ? <ActiveBadge /> : null}
          {theme.isBuiltIn ? (
            <span className="text-[0.75rem] text-muted">Read-only</span>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1">
          {onActivate && !theme.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Set active ${theme.name}`}
              onClick={onActivate}
            >
              Set active
            </Button>
          ) : null}
          {onEdit ? (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Edit ${theme.name}`}
              onClick={onEdit}
            >
              <Pencil aria-hidden="true" size={14} />
              Edit
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Delete ${theme.name}`}
              onClick={onDelete}
            >
              <Trash2 aria-hidden="true" size={14} />
              Delete
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  )
}

export function SettingsPage() {
  const {
    promptStyles,
    resumeThemes,
    activatePromptStyle,
    deletePromptStyle,
    activateResumeTheme,
    deleteResumeTheme,
  } = useJobriq()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PromptStyle | null>(null)
  const [deleting, setDeleting] = useState<PromptStyle | null>(null)
  const [themeDialogOpen, setThemeDialogOpen] = useState(false)
  const [editingTheme, setEditingTheme] = useState<ResumeTheme | null>(null)
  const [deletingTheme, setDeletingTheme] = useState<ResumeTheme | null>(null)

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (style: PromptStyle) => {
    setEditing(style)
    setDialogOpen(true)
  }

  const openCreateTheme = () => {
    setEditingTheme(null)
    setThemeDialogOpen(true)
  }

  const openEditTheme = (theme: ResumeTheme) => {
    setEditingTheme(theme)
    setThemeDialogOpen(true)
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

  const handleActivateTheme = (id: string) => {
    void activateResumeTheme(id)
      .then(() => {
        focusById(`resume-theme-title-${id}`)
      })
      .catch(() => {
        // The provider surfaces the error in the sync banner.
      })
  }

  const handleDeleteTheme = () => {
    if (!deletingTheme) {
      return
    }

    const id = deletingTheme.id
    setDeletingTheme(null)

    void deleteResumeTheme(id)
      .then(() => {
        focusById('saved-themes-title')
      })
      .catch(() => {
        // The provider surfaces the error in the sync banner.
      })
  }

  const baseline = promptStyles.baseline
  const styles = promptStyles.styles
  const { themes, builtIns } = resumeThemes
  const activeTheme =
    themes.find((theme) => theme.id === resumeThemes.activeThemeId) ??
    builtIns.find((theme) => theme.id === resumeThemes.activeThemeId) ??
    builtIns[0] ??
    themes[0]
  const baseStyles = activeTheme?.styles

  return (
    <div className="space-y-10">
      <PageHeader
        title="Settings"
        description="Choose the voice Jobriq writes in and the design it uses for exported resumes and cover letters."
        actions={
          <>
            {baseStyles ? (
              <Button variant="outline" onClick={openCreateTheme}>
                <Plus aria-hidden="true" size={15} />
                New theme
              </Button>
            ) : null}
            <Button variant="primary" onClick={openCreate}>
              <Plus aria-hidden="true" size={15} />
              New prompt style
            </Button>
          </>
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

      <section
        aria-labelledby="built-in-themes-title"
        className="grid gap-5 border-t border-border pt-8 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-10"
      >
        <div>
          <h2
            id="built-in-themes-title"
            className="text-[1.3rem] font-medium leading-tight"
          >
            Built-in themes
          </h2>
          <p className="mt-2 max-w-[32ch] text-[0.8rem] leading-5 text-muted">
            Built-in designs ship with Jobriq. Pick one to style every DOCX
            export.
          </p>
        </div>

        <div>
          {builtIns.length === 0 ? (
            <p className="border-y border-border py-8 text-[0.88rem] leading-6 text-muted">
              Built-in themes are unavailable.
            </p>
          ) : (
            <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
              {builtIns.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  titleId={`resume-theme-title-${theme.id}`}
                  onActivate={() => handleActivateTheme(theme.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section
        aria-labelledby="saved-themes-title"
        className="grid gap-5 border-t border-border pt-8 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-10"
      >
        <div>
          <h2
            id="saved-themes-title"
            tabIndex={-1}
            className="text-[1.3rem] font-medium leading-tight"
          >
            Your themes
          </h2>
          <p className="mt-2 max-w-[32ch] text-[0.8rem] leading-5 text-muted">
            Custom designs you can edit. The active theme applies to every DOCX
            export.
          </p>
        </div>

        <div>
          {themes.length === 0 ? (
            <div className="border-y border-border py-10">
              <h3 className="text-[1.1rem] font-medium">No saved themes yet</h3>
              <p className="mt-2 max-w-[48ch] text-[0.88rem] leading-6 text-muted">
                Build a design from the active theme, then tune its fonts,
                colors, sizes, and margins.
              </p>
              {baseStyles ? (
                <Button variant="outline" className="mt-5" onClick={openCreateTheme}>
                  <Plus aria-hidden="true" size={15} />
                  Create your first theme
                </Button>
              ) : null}
            </div>
          ) : (
            <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
              {themes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  titleId={`resume-theme-title-${theme.id}`}
                  onActivate={() => handleActivateTheme(theme.id)}
                  onEdit={() => openEditTheme(theme)}
                  onDelete={() => setDeletingTheme(theme)}
                />
              ))}
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

      {baseStyles ? (
        <ResumeThemeDialog
          key={themeDialogOpen ? (editingTheme?.id ?? 'new') : 'closed'}
          open={themeDialogOpen}
          onOpenChange={setThemeDialogOpen}
          theme={editingTheme}
          baseStyles={baseStyles}
        />
      ) : null}

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

      <ConfirmDialog
        open={deletingTheme !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingTheme(null)
          }
        }}
        title="Delete resume theme"
        description={
          deletingTheme
            ? `Delete “${deletingTheme.name}”? Jobriq falls back to the Classic theme if this design is active.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={handleDeleteTheme}
      />
    </div>
  )
}
