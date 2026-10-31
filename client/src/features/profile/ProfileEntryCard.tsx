import { Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../../components/ui/button'
import { entryAnchorId, type EntrySection } from './entryNavItems'

interface ProfileEntryCardProps {
  section: EntrySection
  index: number
  heading: string
  removeLabel: string
  onRemove: () => void
  children: ReactNode
}

export function ProfileEntryCard({
  section,
  index,
  heading,
  removeLabel,
  onRemove,
  children,
}: ProfileEntryCardProps) {
  const anchor = entryAnchorId(section, index)

  return (
    <div
      id={anchor}
      role="group"
      aria-labelledby={`${anchor}-title`}
      tabIndex={-1}
      className="scroll-mt-[8rem] border-t border-border pt-5 first:border-t-0 first:pt-0"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3
          id={`${anchor}-title`}
          className="font-sans text-[0.78rem] font-medium tracking-[0.01em] text-muted"
        >
          {heading}
        </h3>
        <Button variant="ghost" size="sm" onClick={onRemove} aria-label={removeLabel}>
          <Trash2 aria-hidden="true" size={16} />
          Remove
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  )
}
