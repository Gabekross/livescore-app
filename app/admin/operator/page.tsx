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
import { formatLocalDateTime } from '@/lib/utils/dateTime'
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
  }, [orgId, role])

  const fetchMatches = async () => {
    if (!orgId) return

    // Fetch today's matches + next 7 days + any currently live
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + 7)

    let assignedMatchIds: string[] | null = null

    if (role === 'match_operator') {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id

      if (!userId) {
        toast.error('Not authenticated')
        setLoading(false)
        return
      }

      const { data: assignments, error: assignmentError } = await supabase
        .from('match_operator_assignments')
        .select('match_id')
        .eq('operator_id', userId)
        .eq('organization_id', orgId)

      if (assignmentError) {
        toast.error('Failed to load match assignments')
        setLoading(false)
        return
      }

      assignedMatchIds = (assignments || []).map((assignment) => assignment.match_id)

      if (assignedMatchIds.length === 0) {
        setMatches([])
        setLoading(false)
        return
      }
    }

    let query = supabase
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

    if (assignedMatchIds) {
      query = query.in('id', assignedMatchIds)
    }

    const { data, error } = await query

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
          {role === 'match_operator'
            ? 'Manage live scores and stats for your assigned matches.'
            : 'Manage live match scores and status. Showing today and next 7 days.'}
        </p>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Loading matches...</div>
      ) : matches.length === 0 ? (
        <div className={styles.emptyState}>
          {role === 'match_operator'
            ? 'No matches have been assigned to you yet.'
            : 'No upcoming matches in the next 7 days.'}
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

// ── Types for player stats ──────────────────────────────────────────────────

interface LineupPlayer {
  player_id:    string
  team_id:      string
  is_starting:  boolean
  goals:        number
  assists:      number
  yellow_cards: number
  red_cards:    number
  players: {
    id:             string
    name:           string
    first_name?:    string
    jersey_number?: number
  }
}

type StatKey = 'goals' | 'assists' | 'yellow_cards' | 'red_cards'

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

  const [statsOpen,    setStatsOpen]    = useState(false)
  const [lineups,      setLineups]      = useState<LineupPlayer[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [localStats,   setLocalStats]   = useState<Record<string, Record<StatKey, number>>>({})

  const homeName = match.home_team?.name ?? 'Home'
  const awayName = match.away_team?.name ?? 'Away'
  const homeId   = match.home_team?.id
  const awayId   = match.away_team?.id

  const fetchLineups = async () => {
    if (lineups.length > 0) return
    setStatsLoading(true)

    const { data, error } = await supabase
      .from('match_lineups')
      .select('player_id, team_id, is_starting, goals, assists, yellow_cards, red_cards, players(id, name, first_name, jersey_number)')
      .eq('match_id', match.id)

    if (!error && data) {
      const rows = (data as unknown as LineupPlayer[]).filter(r => r.players)
      setLineups(rows)
      const stats: Record<string, Record<StatKey, number>> = {}
      rows.forEach(r => {
        stats[r.player_id] = {
          goals:        r.goals ?? 0,
          assists:      r.assists ?? 0,
          yellow_cards: r.yellow_cards ?? 0,
          red_cards:    r.red_cards ?? 0,
        }
      })
      setLocalStats(stats)
    }
    setStatsLoading(false)
  }

  const toggleStats = () => {
    if (!statsOpen) fetchLineups()
    setStatsOpen(!statsOpen)
  }

  const handleStatChange = (playerId: string, key: StatKey, value: number) => {
    setLocalStats(prev => ({
      ...prev,
      [playerId]: { ...(prev[playerId] || { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 }), [key]: value },
    }))
  }

  const handleSave = async () => {
    setSaving(true)

    const { error: matchError } = await supabase
      .from('matches')
      .update({
        home_score: status === 'scheduled' ? null : homeScore,
        away_score: status === 'scheduled' ? null : awayScore,
        status,
      })
      .eq('id', match.id)

    if (matchError) {
      toast.error(`Update failed: ${matchError.message}`)
      setSaving(false)
      return
    }

    if (Object.keys(localStats).length > 0) {
      for (const [playerId, stats] of Object.entries(localStats)) {
        const { error: statError } = await supabase
          .from('match_lineups')
          .update({
            goals:        stats.goals ?? 0,
            assists:      stats.assists ?? 0,
            yellow_cards: stats.yellow_cards ?? 0,
            red_cards:    stats.red_cards ?? 0,
          })
          .eq('match_id', match.id)
          .eq('player_id', playerId)

        if (statError) {
          toast.error(`Stats failed for a player`)
          break
        }
      }
    }

    toast.success('Match updated')
    onUpdate()
    setSaving(false)
  }

  const renderTeamStats = (teamId: string | undefined, teamName: string) => {
    if (!teamId) return null
    const teamLineups = lineups.filter(l => l.team_id === teamId)
    const starters    = teamLineups.filter(l => l.is_starting)
    const bench       = teamLineups.filter(l => !l.is_starting)

    if (teamLineups.length === 0) {
      return (
        <div className={styles.statsTeamSection}>
          <div className={styles.statsTeamName}>{teamName}</div>
          <p className={styles.statsEmpty}>No lineup set for this team.</p>
        </div>
      )
    }

    return (
      <div className={styles.statsTeamSection}>
        <div className={styles.statsTeamName}>{teamName}</div>

        {starters.length > 0 && (
          <>
            <div className={styles.statsGroupLabel}>Starters</div>
            {starters.map(p => renderStatRow(p))}
          </>
        )}

        {bench.length > 0 && (
          <>
            <div className={styles.statsGroupLabel}>Bench</div>
            {bench.map(p => renderStatRow(p))}
          </>
        )}
      </div>
    )
  }

  const renderStatRow = (lineup: LineupPlayer) => {
    const p = lineup.players
    const playerLabel = `#${p.jersey_number ?? '?'} ${p.first_name || p.name}`
    const stats = localStats[lineup.player_id] || { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 }

    return (
      <div key={lineup.player_id} className={styles.statPlayerRow}>
        <div className={styles.statPlayerName}>{playerLabel}</div>
        <div className={styles.statFields}>
          <div className={styles.statField}>
            <label className={styles.statLabel} htmlFor={`g-${lineup.player_id}`}>Goals</label>
            <input id={`g-${lineup.player_id}`} type="number" min={0} aria-label={`Goals for ${playerLabel}`}
              value={stats.goals} onChange={e => handleStatChange(lineup.player_id, 'goals', Number(e.target.value))} />
          </div>
          <div className={styles.statField}>
            <label className={styles.statLabel} htmlFor={`a-${lineup.player_id}`}>Assists</label>
            <input id={`a-${lineup.player_id}`} type="number" min={0} aria-label={`Assists for ${playerLabel}`}
              value={stats.assists} onChange={e => handleStatChange(lineup.player_id, 'assists', Number(e.target.value))} />
          </div>
          <div className={styles.statField}>
            <label className={styles.statLabel} htmlFor={`yc-${lineup.player_id}`}>YC</label>
            <input id={`yc-${lineup.player_id}`} type="number" min={0} max={2} aria-label={`Yellow cards for ${playerLabel}`}
              value={stats.yellow_cards} onChange={e => handleStatChange(lineup.player_id, 'yellow_cards', Number(e.target.value))} />
          </div>
          <div className={styles.statField}>
            <label className={styles.statLabel} htmlFor={`rc-${lineup.player_id}`}>RC</label>
            <input id={`rc-${lineup.player_id}`} type="number" min={0} max={1} aria-label={`Red cards for ${playerLabel}`}
              value={stats.red_cards} onChange={e => handleStatChange(lineup.player_id, 'red_cards', Number(e.target.value))} />
          </div>
        </div>
      </div>
    )
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
          {formatLocalDateTime(match.match_date, 'shortDateTime')}
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

      {/* Status + save + stats toggle */}
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

        <button onClick={toggleStats} type="button" className={styles.statsToggle}>
          {statsOpen ? 'Hide Stats' : 'Player Stats'}
        </button>

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

      {/* Player stats panel */}
      {statsOpen && (
        <div className={styles.statsPanel}>
          {statsLoading ? (
            <p className={styles.statsEmpty}>Loading lineups...</p>
          ) : lineups.length === 0 ? (
            <p className={styles.statsEmpty}>No lineups set for this match. Add lineups from the full match editor first.</p>
          ) : (
            <>
              {renderTeamStats(homeId, homeName)}
              {renderTeamStats(awayId, awayName)}
            </>
          )}
        </div>
      )}
    </div>
  )
}
