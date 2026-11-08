import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  contentId?: string
  onOpenAutoFocus?: (event: Event) => void
  onCloseAutoFocus?: (event: Event) => void
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  actions,
  children,
  className,
  contentId,
  onOpenAutoFocus,
  onCloseAutoFocus,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-navy/45" />
        <DialogPrimitive.Content
          id={contentId}
          onOpenAutoFocus={onOpenAutoFocus}
          onCloseAutoFocus={onCloseAutoFocus}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-sm border border-border bg-surface p-6 shadow-sheet sm:p-7',
            className,
          )}
        >
          <div className="mb-5 flex shrink-0 items-start justify-between gap-4 border-b border-border pb-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="font-display text-[1.4rem] font-medium leading-tight text-navy">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-2 max-w-[52ch] text-[0.85rem] leading-6 text-muted">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <DialogPrimitive.Close
                aria-label="Close"
                className="rounded-sm p-1.5 text-muted transition-colors hover:bg-canvas hover:text-navy"
              >
                <X aria-hidden="true" size={18} />
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
