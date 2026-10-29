import type { PersonalInfo } from '../../lib/types'

export function DocumentHeader({ personal }: { personal: PersonalInfo }) {
  const contact = [personal.email, personal.phone, personal.location]
    .filter(Boolean)
    .join('  |  ')
  const links = [personal.linkedin, personal.github, personal.website]
    .filter(Boolean)
    .join('  |  ')

  return (
    <div className="border-b border-navy/20 pb-5">
      <h3 className="font-display text-[1.75rem] font-medium leading-tight">
        {personal.name}
      </h3>
      {contact ? (
        <p className="mt-1.5 break-words text-[0.78rem] tracking-[0.01em] text-muted">
          {contact}
        </p>
      ) : null}
      {links ? (
        <p className="mt-1 break-all text-[0.78rem] tracking-[0.01em] text-muted">
          {links}
        </p>
      ) : null}
    </div>
  )
}
