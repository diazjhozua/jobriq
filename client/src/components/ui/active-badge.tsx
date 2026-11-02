import { Check } from 'lucide-react'

export function ActiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 border border-primary/40 bg-primary/5 px-1.5 py-0.5 text-[0.7rem] font-medium text-primary">
      <Check aria-hidden="true" size={11} />
      Active
    </span>
  )
}
