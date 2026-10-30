import { useEffect, useRef, useState } from 'react'
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
  const [active, setActive] = useState<string>(PROFILE_SECTIONS[0].id)
  const activeLink = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    activeLink.current?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }, [active])

  useEffect(() => {
    const elements = PROFILE_SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter((element): element is HTMLElement => element !== null)

    if (elements.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)

        if (visible[0]) {
          setActive(visible[0].target.id)
        }
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [])

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
