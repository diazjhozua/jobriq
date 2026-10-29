import { Briefcase, Plus } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ConfirmDialog } from '../../components/ui/alert-dialog'
import { Button } from '../../components/ui/button'
import type { ApplicationStatus, JobApplication } from '../../lib/types'
import { useJobriq } from '../../providers/JobriqProvider'
import { ApplicationDialog } from './ApplicationDialog'
import { ApplicationRow } from './ApplicationRow'
import { GeneratedResumeDialog } from './GeneratedResumeDialog'

export function ApplicationsPage() {
  const { applications, updateApplicationStatus, deleteApplication } = useJobriq()
  const [addOpen, setAddOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<JobApplication | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const selected = applications.find((application) => application.id === selectedId) ?? null

  const toggleDescription = (id: string) => {
    setExpandedId((current) => (current === id ? null : id))
  }

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    void updateApplicationStatus(id, status).catch(() => {
      // The provider rolls the change back and surfaces the error in the banner.
    })
  }

  const handleDelete = () => {
    if (!deleting) {
      return
    }

    const id = deleting.id
    setDeleting(null)

    if (selectedId === id) {
      setSelectedId(null)
    }

    if (expandedId === id) {
      setExpandedId(null)
    }

    void deleteApplication(id).catch(() => {
      // The provider restores the application and surfaces the error in the banner.
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Applications"
        description="Track each role from saved to offer, and generate a resume for the ones worth pursuing."
        actions={
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <Plus aria-hidden="true" size={15} />
            Add application
          </Button>
        }
      />

      {applications.length === 0 ? (
        <div className="border-y border-border py-14 sm:py-16">
          <Briefcase aria-hidden="true" size={20} className="text-accent" />
          <h2 className="mt-4 text-[1.4rem] font-medium">No applications yet</h2>
          <p className="mt-2 max-w-[48ch] text-[0.9rem] leading-6 text-muted">
            Add a role you are interested in, paste its job description, and generate a resume
            tailored to it.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => setAddOpen(true)}>
            <Plus aria-hidden="true" size={15} />
            Add your first application
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden border-y border-border">
          <table className="w-full table-fixed border-collapse text-[0.9rem] text-body">
            <caption className="sr-only">Job applications</caption>
            <thead className="text-[0.72rem] font-medium text-muted">
              <tr className="border-b border-border">
                <th scope="col" className="break-words px-2 py-3 text-left font-medium sm:px-4">
                  Application
                </th>
                <th scope="col" className="w-32 px-2 py-3 text-left font-medium">
                  Status
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 text-left font-medium md:table-cell md:w-32"
                >
                  Added
                </th>
                <th
                  scope="col"
                  className="w-20 py-3 pl-1 pr-2 text-right font-medium sm:w-56 lg:w-72"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  expanded={expandedId === application.id}
                  onToggleDescription={toggleDescription}
                  onStatusChange={handleStatusChange}
                  onOpenResume={setSelectedId}
                  onDelete={setDeleting}
                />
              ))}
            </tbody>
          </table>
        </div>
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
