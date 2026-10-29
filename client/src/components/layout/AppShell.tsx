import { Loader2, X } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Button } from '../ui/button'
import { useJobriq } from '../../providers/JobriqProvider'
import { cn } from '../../lib/utils'
import { Logo } from './Logo'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative inline-flex h-[4.25rem] items-center px-2 text-[0.82rem] font-medium tracking-[0.01em] transition-colors sm:px-3',
    isActive
      ? 'text-navy after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:bg-accent sm:after:inset-x-3'
      : 'text-muted hover:text-navy',
  )

const shellWidth = 'mx-auto w-full max-w-[76rem] px-5 sm:px-8'

export function AppShell() {
  const { status, loadError, retry, syncError, clearSyncError } = useJobriq()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-canvas/95 backdrop-blur-sm">
        <div className="h-[3px] bg-primary" aria-hidden="true" />
        <div className={cn(shellWidth, 'flex h-[4.25rem] items-center justify-between gap-6')}>
          <Link to="/profile" aria-label="Jobriq" className="flex items-center">
            <Logo className="h-9 w-9 shrink-0" />
            <span
              aria-hidden="true"
              className="font-display text-[1.6rem] font-medium leading-none tracking-[-0.02em] text-navy"
            >
              obriq
            </span>
          </Link>

          <nav aria-label="Main">
            <ul className="flex items-center gap-1 sm:gap-2">
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
          <div className={cn(shellWidth, 'flex items-start gap-3 py-3')}>
            <span className="mt-1.5 h-4 w-[2px] shrink-0 bg-accent" aria-hidden="true" />
            <p className="flex-1 text-[0.85rem] leading-6 text-body">{syncError}</p>
            <button
              type="button"
              onClick={clearSyncError}
              aria-label="Dismiss sync warning"
              className="rounded-sm p-1 text-muted transition-colors hover:bg-canvas hover:text-navy"
            >
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      ) : null}

      {status === 'loading' ? (
        <main className={cn(shellWidth, 'flex-1 py-10 sm:py-14')}>
          <div
            role="status"
            className="flex items-center gap-3 border-y border-border py-16"
          >
            <Loader2 aria-hidden="true" size={20} className="animate-spin text-primary" />
            <p className="font-display text-lg text-navy">Loading your workspace</p>
          </div>
        </main>
      ) : status === 'error' ? (
        <main className={cn(shellWidth, 'flex-1 py-10 sm:py-14')}>
          <div role="alert" className="border-y border-border py-14">
            <h1 className="text-[1.6rem] font-medium">Could not load your workspace</h1>
            <p className="mt-2 max-w-[52ch] text-[0.9rem] leading-6 text-muted">
              {loadError ?? 'The server could not be reached.'}
            </p>
            <Button variant="primary" className="mt-6" onClick={retry}>
              Try again
            </Button>
          </div>
        </main>
      ) : (
        <main className={cn(shellWidth, 'flex-1 py-10 sm:py-14')}>
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      )}
    </div>
  )
}
