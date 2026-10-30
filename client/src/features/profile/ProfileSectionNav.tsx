import { useEffect, useRef } from 'react'
import { useActiveAnchor } from '../../lib/useActiveAnchor'
import { cn } from '../../lib/utils'

const PROFILE_SECTIONS = [
  { id: 'profile-personal', label: 'Personal' },
  { id: 'profile-summary', label: 'Summary' },
  { id: 'profile-experience', label: 'Experience' },
  { id: 'profile-education', label: 'Education' },
  { id: 'profile-skills', label: 'Skills' },
  { id: 'profile-projects', label: 'Projects' },
] as const

export function ProfileSectionNav() {
  const active = useActiveAnchor(PROFILE_SECTIONS.map((section) => section.id))
  const activeLink = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    activeLink.current?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }, [active])

  return (
    <nav
      aria-label="Profile sections"
      className="sticky top-[4.44rem] z-20 -mx-5 border-y border-border bg-canvas/95 px-5 backdrop-blur-sm sm:-mx-8 sm:px-8"
    >
      <ul className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PROFILE_SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              ref={active === section.id ? activeLink : undefined}
              href={`#${section.id}`}
              aria-current={active === section.id ? 'location' : undefined}
              className={cn(
                'inline-flex h-8 items-center whitespace-nowrap px-2.5 text-[0.78rem] font-medium tracking-[0.01em] transition-colors',
                active === section.id
                  ? 'bg-primary text-surface'
                  : 'text-muted hover:bg-surface hover:text-navy',
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
