import { Loader2, X } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { useJobriq } from '../../providers/JobriqProvider'
import { cn } from '../../lib/utils'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative inline-flex h-16 items-center px-3 text-sm font-medium transition-colors',
    isActive
      ? 'text-navy after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent'
      : 'text-muted hover:text-navy',
  )

export function AppShell() {
  const { status, loadError, retry, syncError, clearSyncError } = useJobriq()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/profile" className="flex items-center gap-2">
            <span className="h-6 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-xl font-semibold tracking-tight text-navy">Jobriq</span>
          </Link>

          <nav aria-label="Main">
            <ul className="flex items-center">
              <li>
                <NavLink to="/profile" className={navLinkClass}>
                  Profile
                </NavLink>
              </li>
              <li>
                <NavLink to="/applications" className={navLinkClass}>
                  Applications
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {syncError ? (
        <div role="alert" className="border-b border-border bg-surface">
          <div className="mx-auto flex w-full max-w-6xl items-start gap-3 px-4 py-3 sm:px-6">
            <span className="mt-1 h-4 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <p className="flex-1 text-sm text-body">{syncError}</p>
            <button
              type="button"
              onClick={clearSyncError}
              aria-label="Dismiss sync warning"
              className="rounded-md p-1 text-muted hover:bg-canvas hover:text-navy"
            >
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      ) : null}

      {status === 'loading' ? (
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <Card
            role="status"
            className="flex min-h-40 flex-col items-center justify-center gap-3 px-6 py-14 text-center"
          >
            <Loader2 aria-hidden="true" size={24} className="animate-spin text-brand-blue" />
            <p className="text-sm font-medium text-navy">Loading your workspace</p>
          </Card>
        </main>
      ) : status === 'error' ? (
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <Card role="alert" className="px-6 py-14 text-center">
            <h1 className="text-lg font-semibold">Could not load your workspace</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              {loadError ?? 'The server could not be reached.'}
            </p>
            <Button variant="primary" className="mt-6" onClick={retry}>
              Try again
            </Button>
          </Card>
        </main>
      ) : (
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <Outlet />
        </main>
      )}
    </div>
  )
}
