import { ChevronDown } from 'lucide-react'
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from '../../lib/types'
import { cn } from '../../lib/utils'

const dotStyles: Record<ApplicationStatus, string> = {
  saved: 'bg-status-saved-fg',
  applied: 'bg-status-applied-fg',
  interviewing: 'bg-status-interviewing-fg',
  offer: 'bg-status-offer-fg',
  rejected: 'bg-status-rejected-fg',
}

const textStyles: Record<ApplicationStatus, string> = {
  saved: 'text-status-saved-fg',
  applied: 'text-status-applied-fg',
  interviewing: 'text-status-interviewing-fg',
  offer: 'text-status-offer-fg',
  rejected: 'text-status-rejected-fg',
}

interface StatusBadgeProps {
  status: ApplicationStatus
  onChange?: (status: ApplicationStatus) => void
  className?: string
  label?: string
}

export function StatusBadge({
  status,
  onChange,
  className,
  label = 'Application status',
}: StatusBadgeProps) {
  const dot = (
    <span
      aria-hidden="true"
      className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotStyles[status])}
    />
  )

  if (!onChange) {
    return (
      <span
        className={cn(
          'inline-flex max-w-full items-center gap-2 text-[0.75rem] font-medium',
          textStyles[status],
          className,
        )}
      >
        {dot}
        {STATUS_LABELS[status]}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'relative flex w-full max-w-full items-center gap-2',
        textStyles[status],
        className,
      )}
    >
      {dot}
      <select
        aria-label={label}
        value={status}
        onChange={(event) => onChange(event.target.value as ApplicationStatus)}
        className="min-w-0 flex-1 cursor-pointer appearance-none border-0 bg-transparent py-1 pr-5 text-[0.75rem] font-medium"
      >
        {APPLICATION_STATUSES.map((option) => (
          <option key={option} value={option}>
            {STATUS_LABELS[option]}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        size={12}
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2"
      />
    </span>
  )
}
