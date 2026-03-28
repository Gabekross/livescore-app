'use client'

// app/admin/operator/page.tsx
// Game-day match operator interface.
// Accessible by: match_operator (restricted), org_admin, power_admin.
// Shows only this org's matches for today + next 7 days, plus any live/halftime matches.
// Operator can update: score, status, match events (lineups).

import { useEffect, useState } from 'react'
import Link                    from 'next/link'
import { useRouter }           from 'next/navigation'
import { supabase }            from '@/lib/supabase'
import { useAdminOrg }         from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }     from '@/components/admin/AdminOrgGate'
import toast                   from 'react-hot-toast'
import styles                  from '@/styles/components/Operator.module.scss'

interface Match {
  id:         string
  match_date: string
  status:     'scheduled' | 'live' | 'halftime' | 'completed'
  home_score: number | null
  away_score: number | null
  home_team:  { id: string; name: string } | null
  away_team:  { id: string; name: string } | null
  tournament: { name: string } | null
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  live:      'Live',
  halftime:  'Half Time',
  completed: 'Full Time',
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#6b7280',
  live:      '#ef4444',
  halftime:  '#a855f7',
  completed: '#22c55e',
}

export default function OperatorPage() {
  const { orgId, role, orgName } = useAdminOrg()
  const orgGate = useAdminOrgGate()
  const router = useRouter()

  const [matches,  setMatches]  = useState<Match[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!orgId) return
    fetchMatches()
  }, [orgId])

  const fetchMatches = async () => {
    if (!orgId) return

    // Fetch today's matches + next 7 days + any currently live
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + 7)

    const { data, error } = await supabase
      .from('matches')
      .select(`
        id, match_date, status, home_score, away_score,
        home_team:home_team_id(id, name),
        away_team:away_team_id(id, name),
        tournament:tournament_id(name)
      `)
      .eq('organization_id', orgId)
      .or(`status.in.(live,halftime),and(match_date.gte.${from.toISOString()},match_date.lte.${to.toISOString()})`)
      .order('match_date')

    if (error) {
      toast.error('Failed to load matches')
    } else {
      setMatches(((data || []) as unknown as Match[]).map((m) => ({
        ...m,
        home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
        away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
        tournament: Array.isArray(m.tournament) ? m.tournament[0] : m.tournament,
      })))
    }
    setLoading(false)
  }

  if (orgGate) return orgGate

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Game Day — {orgName}</h1>
        <p className={styles.subheading}>
          Manage live match scores and status. Showing today and next 7 days.
        </p>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Loading matches...</div>
      ) : matches.length === 0 ? (
        <div className={styles.emptyState}>
          No upcoming matches in the next 7 days.
        </div>
      ) : (
        <div className={styles.matchList}>
          {matches.map((m) => (
            <MatchOperatorRow
              key={m.id}
              match={m}
              onUpdate={fetchMatches}
            />
          ))}
        </div>
      )}

      {/* Full match management link for org_admin+ */}
      {role !== 'match_operator' && (
        <Link href="/admin/dashboard" className={styles.backLink}>
          &#8592; Back to Admin Dashboard
        </Link>
      )}
    </div>
  )
}

// ── Individual match row with inline update controls ─────────────────────────

function MatchOperatorRow({
  match,
  onUpdate,
}: {
  match:    Match
  onUpdate: () => void
}) {
  const [homeScore, setHomeScore] = useState(match.home_score ?? 0)
  const [awayScore, setAwayScore] = useState(match.away_score ?? 0)
  const [status,    setStatus]    = useState(match.status)
  const [saving,    setSaving]    = useState(false)

  const homeName = match.home_team?.name ?? 'Home'
  const awayName = match.away_team?.name ?? 'Away'

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('matches')
      .update({
        home_score: status === 'scheduled' ? null : homeScore,
        away_score: status === 'scheduled' ? null : awayScore,
        status,
      })
      .eq('id', match.id)

    if (error) {
      toast.error(`Update failed: ${error.message}`)
    } else {
      toast.success('Match updated')
      onUpdate()
    }
    setSaving(false)
  }

  return (
    <div
      className={styles.matchCard}
      style={{ '--status-color': STATUS_COLORS[status] } as React.CSSProperties}
    >
      {/* Header row */}
      <div className={styles.matchHeader}>
        <div className={styles.matchMeta}>
          {match.tournament?.name && <span>{match.tournament.name} · </span>}
          {new Date(match.match_date).toLocaleString('en-GB', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </div>
        <span
          className={styles.statusBadge}
          style={{
            color: STATUS_COLORS[status],
            background: `${STATUS_COLORS[status]}18`,
          }}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Score row */}
      <div className={styles.scoreRow}>
        <span className={styles.teamNameHome}>{homeName}</span>

        {status !== 'scheduled' ? (
          <>
            <input
              type="number"
              min={0}
              max={99}
              value={homeScore}
              onChange={(e) => setHomeScore(Number(e.target.value))}
              className={styles.scoreInput}
            />
            <span className={styles.scoreDivider}>-</span>
            <input
              type="number"
              min={0}
              max={99}
              value={awayScore}
              onChange={(e) => setAwayScore(Number(e.target.value))}
              className={styles.scoreInput}
            />
          </>
        ) : (
          <span className={styles.vsLabel}>vs</span>
        )}

        <span className={styles.teamName}>{awayName}</span>
      </div>

      {/* Status + save */}
      <div className={styles.controlsRow}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Match['status'])}
          className={styles.statusSelect}
        >
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="halftime">Half Time</option>
          <option value="completed">Full Time</option>
        </select>

        <button
          onClick={handleSave}
          disabled={saving}
          className={styles.saveButton}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        <Link href="/admin/tournaments" className={styles.detailLink}>
          Full details ›
        </Link>
      </div>
    </div>
  )
}
