import { useActiveAnchor } from '../../lib/useActiveAnchor'
import { cn } from '../../lib/utils'
import type { EntryNavItem } from './entryNavItems'

interface EntryNavProps {
  ariaLabel: string
  items: EntryNavItem[]
}

export function EntryNav({ ariaLabel, items }: EntryNavProps) {
  const active = useActiveAnchor(
    items.map((item) => item.id),
    items.map((item) => item.entryId).join('\n'),
  )

  if (items.length === 0) {
    return null
  }

  return (
    <nav aria-label={ariaLabel} className="mt-6 border-t border-border pt-4">
      <ol className="-mx-1 max-h-48 space-y-0.5 overflow-y-auto overscroll-contain px-1 lg:max-h-[calc(100vh-20rem)]">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? 'location' : undefined}
              title={item.label}
              className={cn(
                'line-clamp-2 min-h-9 border-l-2 py-1.5 pl-2.5 pr-1 text-[0.78rem] leading-5 transition-colors break-words',
                active === item.id
                  ? 'border-primary font-medium text-navy'
                  : 'border-transparent text-muted hover:border-border hover:text-navy',
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
