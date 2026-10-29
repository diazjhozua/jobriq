const J_PATH =
  'M40.17 35.98Q40.17 39.09 38.77 41.81Q37.37 44.53 35.03 46.60Q32.69 48.67 29.84 49.83Q26.99 51.00 24.11 51.00Q22.66 51.00 21.69 50.58Q20.72 50.16 20.23 49.39Q19.75 48.62 19.75 47.60Q19.75 46.23 20.60 45.35Q21.46 44.47 22.54 44.47Q22.86 44.47 23.36 44.90Q23.87 45.33 24.52 45.90Q25.17 46.47 25.96 46.91Q26.75 47.34 27.62 47.34Q28.62 47.34 29.14 46.80Q29.66 46.25 29.66 44.79V15.09L25.59 13.93V13.00H44.25V13.93L40.17 15.09Z'

interface LogoProps {
  className?: string
  period?: boolean
}

export function Logo({ className, period = true }: LogoProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="4" y="4" width="56" height="56" rx="2" className="fill-primary" />
      <path d={J_PATH} className="fill-canvas" />
      {period ? <rect x="46" y="43" width="8" height="8" className="fill-accent" /> : null}
    </svg>
  )
}
