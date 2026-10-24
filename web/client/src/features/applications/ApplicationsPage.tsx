import { Briefcase, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '../../components/ui/alert-dialog'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import type { ApplicationStatus, JobApplication } from '../../lib/types'
import { cn, formatDate } from '../../lib/utils'
import { useJobriq } from '../../providers/JobriqProvider'
import { ApplicationDialog } from './ApplicationDialog'
import { GeneratedResumeDialog } from './GeneratedResumeDialog'
import { StatusBadge } from './StatusBadge'

export function ApplicationsPage() {
  const { applications, updateApplicationStatus, deleteApplication } = useJobriq()
  const [addOpen, setAddOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<JobApplication | null>(null)

  const selected = applications.find((application) => application.id === selectedId) ?? null

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    updateApplicationStatus(id, status)
  }

  const handleDelete = () => {
    if (!deleting) {
      return
    }

    deleteApplication(deleting.id)
    if (selectedId === deleting.id) {
      setSelectedId(null)
    }

    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Applications</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Track each role from saved to offer, and generate a resume for the ones worth pursuing.
          </p>
        </div>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          <Plus aria-hidden="true" size={16} />
          Add application
        </Button>
      </div>

      {applications.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-14 text-center">
          <Briefcase aria-hidden="true" size={32} className="text-brand-blue" />
          <h2 className="mt-4 text-lg font-semibold">No applications yet</h2>
          <p className="mt-2 max-w-md text-sm text-muted">
            Add a role you are interested in, paste its job description, and generate a resume
            tailored to it.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => setAddOpen(true)}>
            <Plus aria-hidden="true" size={16} />
            Add your first application
          </Button>
        </Card>
      ) : (
        <ul className="space-y-4">
          {applications.map((application) => (
            <li key={application.id}>
              <Card
                className={cn(
                  'p-5',
                  selectedId === application.id && 'border-l-4 border-l-accent',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{application.company}</h2>
                    <p className="text-sm text-muted">{application.role}</p>
                  </div>
                  <StatusBadge
                    status={application.status}
                    onChange={(status) => handleStatusChange(application.id, status)}
                  />
                </div>

                <p className="mt-3 text-xs text-muted">
                  Added {formatDate(application.createdAt)}
                  {application.generatedResume ? ' · Resume generated' : ''}
                </p>

                <p className="mt-3 line-clamp-2 text-sm text-body">
                  {application.jobDescription}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedId(application.id)}
                  >
                    <Sparkles aria-hidden="true" size={16} />
                    {application.generatedResume ? 'View resume' : 'Generate resume'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleting(application)}
                    aria-label={`Delete ${application.role} at ${application.company}`}
                  >
                    <Trash2 aria-hidden="true" size={16} />
                    Delete
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ApplicationDialog open={addOpen} onOpenChange={setAddOpen} />

      <GeneratedResumeDialog
        application={selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null)
          }
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null)
          }
        }}
        title="Delete application"
        description={
          deleting
            ? `Delete ${deleting.role} at ${deleting.company}? Its generated resume will be removed too.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  )
}
