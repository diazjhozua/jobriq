import { ChevronDown, Eye, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import type { ApplicationStatus, JobApplication } from '../../lib/types'
import { cn, formatDate } from '../../lib/utils'
import { StatusBadge } from './StatusBadge'

// Keep in sync with the header row in ApplicationsPage.
const COLUMN_COUNT = 4

interface ApplicationRowProps {
  application: JobApplication
  expanded: boolean
  onToggleDescription: (id: string) => void
  onStatusChange: (id: string, status: ApplicationStatus) => void
  onOpenResume: (id: string) => void
  onDelete: (application: JobApplication) => void
}

export function ApplicationRow({
  application,
  expanded,
  onToggleDescription,
  onStatusChange,
  onOpenResume,
  onDelete,
}: ApplicationRowProps) {
  const detailId = `application-description-${application.id}`
  const resumeLabel = application.generatedResume ? 'View resume' : 'Generate resume'
  const target = `${application.role} at ${application.company}`

  return (
    <>
      <tr
        className={cn(
          'border-t border-border transition-colors first:border-t-0 hover:bg-canvas focus-within:bg-canvas',
          expanded && 'bg-canvas',
        )}
      >
        <th
          scope="row"
          className="break-words px-2 py-3 text-left align-middle font-normal sm:px-4"
        >
          <div className="flex min-w-0 items-start gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-expanded={expanded}
              aria-controls={detailId}
              aria-label={`${expanded ? 'Hide' : 'View'} description for ${target}`}
              onClick={() => onToggleDescription(application.id)}
            >
              <ChevronDown
                aria-hidden="true"
                size={16}
                className={cn(
                  'transition-transform duration-150 motion-reduce:transition-none',
                  expanded && 'rotate-180',
                )}
              />
            </Button>
            <div className="min-w-0 flex-1">
              <span className="block break-words font-semibold text-navy">
                {application.company}
              </span>
              <span className="block break-words text-sm text-muted">
                {application.role}
              </span>
              <span className="mt-1 block text-xs text-muted md:hidden">
                Added {formatDate(application.createdAt)}
              </span>
            </div>
          </div>
        </th>
        <td className="w-24 px-2 py-3">
          <StatusBadge
            status={application.status}
            onChange={(status) => onStatusChange(application.id, status)}
            label={`Status for ${target}`}
            className="max-w-full"
          />
        </td>
        <td className="hidden px-4 py-3 md:table-cell md:w-32">
          <time
            dateTime={application.createdAt}
            className="whitespace-nowrap text-sm text-muted"
          >
            {formatDate(application.createdAt)}
          </time>
        </td>
        <td className="w-24 py-3 pl-1 pr-2 text-right sm:w-56 lg:w-72">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-9 px-0 sm:w-auto sm:px-3"
              aria-label={`${resumeLabel} for ${target}`}
              onClick={() => onOpenResume(application.id)}
            >
              {application.generatedResume ? (
                <Eye aria-hidden="true" size={16} />
              ) : (
                <Sparkles aria-hidden="true" size={16} />
              )}
              <span className="hidden sm:inline">{resumeLabel}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-9 px-0 lg:w-auto lg:px-3"
              aria-label={`Delete ${target}`}
              onClick={() => onDelete(application)}
            >
              <Trash2 aria-hidden="true" size={16} />
              <span className="hidden lg:inline">Delete</span>
            </Button>
          </div>
        </td>
      </tr>
      <tr id={detailId} hidden={!expanded} className="border-t border-border bg-canvas">
        <td colSpan={COLUMN_COUNT} className="px-3 py-4 sm:px-4">
          <p className="text-xs font-semibold text-muted">
            <span className="sr-only">{target}: </span>
            Job description
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-body">
            {application.jobDescription}
          </p>
        </td>
      </tr>
    </>
  )
}
