import { X } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
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
  const { storageError, clearStorageError } = useJobriq()

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

      {storageError ? (
        <div role="alert" className="border-b border-border bg-surface">
          <div className="mx-auto flex w-full max-w-6xl items-start gap-3 px-4 py-3 sm:px-6">
            <span className="mt-1 h-4 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <p className="flex-1 text-sm text-body">{storageError}</p>
            <button
              type="button"
              onClick={clearStorageError}
              aria-label="Dismiss storage warning"
              className="rounded-md p-1 text-muted hover:bg-canvas hover:text-navy"
            >
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}
