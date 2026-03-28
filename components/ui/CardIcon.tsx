// components/ui/CardIcon.tsx
// Football card icons (yellow / red) as clean SVG components.
// Uses rounded-rect shapes matching standard football card proportions.
//
// Usage:
//   <YellowCard />             — default 14×18 inline icon
//   <RedCard size={20} />      — custom size
//   <YellowCard className={s.icon} />

interface CardIconProps {
  /** Height in px (width auto-scaled to card proportions) */
  size?: number
  className?: string
  title?: string
}

export function YellowCard({ size = 18, className, title = 'Yellow card' }: CardIconProps) {
  const w = Math.round(size * 0.72)
  return (
    <svg
      width={w}
      height={size}
      viewBox="0 0 14 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <rect x="0.5" y="0.5" width="13" height="17" rx="1.5" fill="#facc15" stroke="#eab308" strokeWidth="1" />
    </svg>
  )
}

export function RedCard({ size = 18, className, title = 'Red card' }: CardIconProps) {
  const w = Math.round(size * 0.72)
  return (
    <svg
      width={w}
      height={size}
      viewBox="0 0 14 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <rect x="0.5" y="0.5" width="13" height="17" rx="1.5" fill="#ef4444" stroke="#dc2626" strokeWidth="1" />
    </svg>
  )
}
