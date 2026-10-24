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
}

export function StatusBadge({ status, onChange, className }: StatusBadgeProps) {
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
    <select
      aria-label="Application status"
      value={status}
      onChange={(event) => onChange(event.target.value as ApplicationStatus)}
      className={cn(
        'cursor-pointer appearance-none rounded-full border-0 px-2.5 py-1 text-xs font-semibold',
        statusStyles[status],
        className,
      )}
    >
      {APPLICATION_STATUSES.map((option) => (
        <option key={option} value={option}>
          {STATUS_LABELS[option]}
        </option>
      ))}
    </select>
  )
}
