// components/ui/StatusBadge.tsx
// Renders a coloured pill badge for match status and type.
// Works in both server and client components (no hooks).

import type { MatchStatus } from '@/lib/utils/match'
import { matchStatusLabel } from '@/lib/utils/match'
import styles from '@/styles/components/StatusBadge.module.scss'

interface Props {
  status:      MatchStatus
  matchDate?:  string
  /** Show "Friendly" badge alongside the status badge */
  isFriendly?: boolean
  className?:  string
}

const STATUS_CLASS: Record<MatchStatus, string> = {
  live:      styles.live,
  halftime:  styles.halftime,
  completed: styles.completed,
  scheduled: styles.scheduled,
}

export default function StatusBadge({ status, matchDate, isFriendly, className }: Props) {
  const label      = matchStatusLabel(status, matchDate)
  const statusCls  = STATUS_CLASS[status] ?? styles.scheduled

  return (
    <span className={`${styles.badge} ${statusCls} ${className ?? ''}`}>
      {status === 'live' && <span className={styles.dot} aria-hidden="true" />}
      {label}
      {isFriendly && (
        <span
          className={`${styles.badge} ${styles.friendly}`}
          style={{ marginLeft: '4px' }}
        >
          Friendly
        </span>
      )}
    </span>
  )
}
