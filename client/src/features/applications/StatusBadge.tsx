import { ChevronDown } from 'lucide-react'
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from '../../lib/types'
import { cn } from '../../lib/utils'

const statusStyles: Record<ApplicationStatus, string> = {
  saved: 'bg-status-saved-bg text-status-saved-fg',
  applied: 'bg-status-applied-bg text-status-applied-fg',
  interviewing: 'bg-status-interviewing-bg text-status-interviewing-fg',
  offer: 'bg-status-offer-bg text-status-offer-fg',
  rejected: 'bg-status-rejected-bg text-status-rejected-fg',
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
  if (!onChange) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
          statusStyles[status],
          className,
        )}
      >
        {STATUS_LABELS[status]}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'relative inline-flex max-w-full rounded-full',
        statusStyles[status],
        className,
      )}
    >
      <select
        aria-label={label}
        value={status}
        onChange={(event) => onChange(event.target.value as ApplicationStatus)}
        className="cursor-pointer appearance-none rounded-full border-0 bg-transparent py-1 pl-2.5 pr-6 text-xs font-semibold"
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
        className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2"
      />
    </span>
  )
}
