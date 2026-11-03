import type { CSSProperties } from 'react'
import type { ResumeThemeStyles } from '../../lib/types'
import { cn } from '../../lib/utils'
import { RESUME_THEME_SAMPLE } from './resumeThemeSample'

interface ResumeThemePreviewProps {
  styles: ResumeThemeStyles
  className?: string
}

// Letter is 8.5in wide, so 100cqw is 612pt. Expressing every size as a share of
// the container width keeps the page proportional at any rendered width.
const PAGE_WIDTH_PT = 612
const PAGE_HEIGHT_PT = 792

const unit = (points: number) =>
  `${((points * 100) / PAGE_WIDTH_PT).toFixed(4)}cqw`

export function ResumeThemePreview({ styles, className }: ResumeThemePreviewProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('border border-border bg-surface', className)}
      style={{ containerType: 'inline-size' } as CSSProperties}
    >
      <div
        data-theme-page=""
        style={{
          minHeight: unit(PAGE_HEIGHT_PT),
          padding: unit(styles.pageMargin),
          fontFamily: styles.bodyFont,
          fontSize: unit(styles.bodySize),
          lineHeight: 1.35,
          color: styles.textColor,
          overflowWrap: 'anywhere',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontFamily: styles.nameFont,
              fontSize: unit(styles.nameSize),
              color: styles.headingColor,
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: unit(4),
            }}
          >
            {RESUME_THEME_SAMPLE.name}
          </p>
          <p
            style={{
              fontSize: unit(styles.smallSize),
              color: styles.mutedColor,
              marginBottom: unit(3),
              whiteSpace: 'pre-wrap',
            }}
          >
            {RESUME_THEME_SAMPLE.contact.join('  |  ')}
          </p>
          <p
            style={{
              fontSize: unit(styles.smallSize),
              color: styles.mutedColor,
              marginBottom: unit(8),
              whiteSpace: 'pre-wrap',
            }}
          >
            {RESUME_THEME_SAMPLE.links.join('  |  ')}
          </p>
        </div>

        {RESUME_THEME_SAMPLE.sections.map((section) => (
          <div key={section.heading}>
            <p
              style={{
                fontSize: unit(styles.headingSize),
                color: styles.headingColor,
                fontWeight: 700,
                marginTop: unit(12),
                marginBottom: unit(3),
              }}
            >
              {section.heading}
            </p>

            {styles.showRules ? (
              <div
                data-theme-rule=""
                style={{
                  borderTop: `${unit(0.5)} solid ${styles.ruleColor}`,
                  marginBottom: unit(6),
                }}
              />
            ) : null}

            {section.text ? (
              <p style={{ marginBottom: unit(10) }}>{section.text}</p>
            ) : null}

            {section.entries?.map((entry) => (
              <div key={`${section.heading}-${entry.title}`} style={{ marginTop: unit(8) }}>
                <p style={{ fontWeight: 700, marginBottom: unit(2) }}>
                  {entry.title}
                  {entry.inlineMeta ? (
                    <span
                      style={{
                        fontSize: unit(styles.smallSize),
                        color: styles.mutedColor,
                        fontWeight: 400,
                        marginLeft: unit(6),
                      }}
                    >
                      {entry.inlineMeta}
                    </span>
                  ) : null}
                </p>

                {entry.meta ? (
                  <p
                    style={{
                      fontSize: unit(styles.smallSize),
                      color: styles.mutedColor,
                      marginBottom: unit(2),
                    }}
                  >
                    {entry.meta}
                  </p>
                ) : null}

                {entry.body ? (
                  <p
                    style={{
                      color:
                        entry.bodyTone === 'muted'
                          ? styles.mutedColor
                          : styles.textColor,
                    }}
                  >
                    {entry.body}
                  </p>
                ) : null}

                {entry.bullets ? (
                  <ul
                    style={{
                      listStyleType: 'disc',
                      paddingLeft: unit(36),
                      marginTop: unit(2),
                    }}
                  >
                    {entry.bullets.map((bullet, index) => (
                      <li key={`${entry.title}-${index}`} style={{ marginBottom: unit(2) }}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
