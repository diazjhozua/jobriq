import { cn } from '../../lib/utils'
import type { ResumeThemeStyles } from '../../lib/types'

interface ResumeThemePreviewProps {
  styles: ResumeThemeStyles
  className?: string
}

const size = (points: number) => `${Math.max(7, Math.round(points * 0.8))}px`

export function ResumeThemePreview({ styles, className }: ResumeThemePreviewProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('border border-border bg-surface', className)}
      style={{ padding: Math.max(10, Math.round(styles.pageMargin / 4)) }}
    >
      <p
        className="leading-none"
        style={{
          fontFamily: styles.nameFont,
          color: styles.headingColor,
          fontSize: size(styles.nameSize),
        }}
      >
        Jane Doe
      </p>
      <p
        className="mt-1"
        style={{
          fontFamily: styles.bodyFont,
          color: styles.mutedColor,
          fontSize: size(styles.smallSize),
        }}
      >
        jane@example.com · Remote
      </p>

      <div
        className="mt-3 pt-2"
        style={{
          borderTop: styles.showRules
            ? `1px solid ${styles.ruleColor}`
            : undefined,
        }}
      >
        <p
          className="font-medium uppercase tracking-[0.14em]"
          style={{
            fontFamily: styles.bodyFont,
            color: styles.headingColor,
            fontSize: size(styles.headingSize),
          }}
        >
          Experience
        </p>
        <p
          className="mt-1 leading-snug"
          style={{
            fontFamily: styles.bodyFont,
            color: styles.textColor,
            fontSize: size(styles.bodySize),
          }}
        >
          Senior Engineer, Acme
          <br />
          Built reliable systems for the platform team.
        </p>
      </div>
    </div>
  )
}
