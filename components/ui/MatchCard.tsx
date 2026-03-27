// components/ui/MatchCard.tsx
// Unified match card for use across all public pages.
// Works as a server component (no hooks, no client state).
// Wraps in a <Link> when href is provided; otherwise renders as a <div>.

import Link       from 'next/link'
import TeamLogo   from './TeamLogo'
import StatusBadge from './StatusBadge'
import type { MatchStatus } from '@/lib/utils/match'
import styles from '@/styles/components/MatchCardShared.module.scss'

interface Team {
  id:       string
  name:     string
  logo_url?: string | null
}

export interface MatchCardProps {
  id:           string
  status:       MatchStatus
  match_date:   string
  match_type?:  string
  home_score:   number | null
  away_score:   number | null
  home_team:    Team
  away_team:    Team
  /** Optional context label shown below the card (e.g., tournament + group name) */
  context?:     string
  /** If provided the card is a clickable link */
  href?:        string
}

export default function MatchCard({
  status,
  match_date,
  match_type,
  home_score,
  away_score,
  home_team,
  away_team,
  context,
  href,
}: MatchCardProps) {
  const isLive       = status === 'live'
  const isScheduled  = status === 'scheduled'
  const isFriendly   = match_type === 'friendly'
  const hasScore     = home_score !== null && away_score !== null
  const cardCls      = `${styles.card} ${isLive ? styles.cardLive : ''}`

  /* Time display for scheduled matches */
  const timeLabel = isScheduled
    ? new Date(match_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null

  const inner = (
    <>
      {/* Status / time column */}
      <div className={styles.statusCol}>
        {isScheduled && timeLabel ? (
          <>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
              {new Date(match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </div>
            <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{timeLabel}</div>
          </>
        ) : (
          <StatusBadge status={status} matchDate={match_date} />
        )}
      </div>

      {/* Teams + score */}
      <div className={styles.matchup}>
        <div className={`${styles.team} ${styles.teamHome}`}>
          <span title={home_team.name}>{home_team.name}</span>
          <TeamLogo src={home_team.logo_url} alt={home_team.name} size={20} />
        </div>

        <div className={styles.scoreBox}>
          {hasScore ? (
            <>
              <span>{home_score}</span>
              <span className={styles.scoreDash}>–</span>
              <span>{away_score}</span>
            </>
          ) : (
            <span className={styles.vsLabel}>vs</span>
          )}
        </div>

        <div className={`${styles.team} ${styles.teamAway}`}>
          <TeamLogo src={away_team.logo_url} alt={away_team.name} size={20} />
          <span title={away_team.name}>{away_team.name}</span>
        </div>
      </div>

      {/* Right badges */}
      <div className={styles.badgeCol}>
        {!isScheduled && <StatusBadge status={status} matchDate={match_date} />}
        {isFriendly && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em',
            color: 'var(--color-friendly)', textTransform: 'uppercase',
          }}>
            Friendly
          </span>
        )}
      </div>

      {context && <div className={styles.context}>{context}</div>}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cardCls} style={{ display: 'flex' }}>
        {inner}
      </Link>
    )
  }

  return <div className={cardCls}>{inner}</div>
}
