import type { ReactNode } from 'react'

interface EnhanceProfileNoticeProps {
  children: ReactNode
  action?: ReactNode
}

export function EnhanceProfileNotice({ children, action }: EnhanceProfileNoticeProps) {
  return (
    <div className="border-l-2 border-brand-blue bg-surface px-3 py-2.5">
      <p className="text-[0.82rem] font-medium text-navy">Polish your profile first</p>
      <p className="mt-1 text-[0.8rem] leading-5 text-muted">{children}</p>
      {action ? <div className="mt-2 text-[0.8rem]">{action}</div> : null}
    </div>
  )
}
