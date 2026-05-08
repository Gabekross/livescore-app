'use client'

// app/admin/players/stats/page.tsx
// Queries the player_stats_summary view (per-player per-team per-tournament rows)
// and aggregates client-side when "All Tournaments" is selected.

import { useEffect, useState, useMemo } from 'react'
import Link                              from 'next/link'
import { supabase }                      from '@/lib/supabase'
import { useAdminOrg }                   from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }               from '@/components/admin/AdminOrgGate'
import { YellowCard, RedCard }          from '@/components/ui/CardIcon'
import styles                            from '@/styles/components/PlayerStatsTable.module.scss'
import dynamic from 'next/dynamic'

const StatsChart = dynamic(() => import('@/components/admin/StatsChart'), { ssr: false })

interface RawStat {
  player_id:       string
  player_name:     string
  first_name:      string | null
  last_name:       string | null
  team_id:         string
  team_name:       string
  tournament_id:   string | null
  tournament_name: string | null
  matches_played:  number
  goals:           number
  assists:         number
  yellow_cards:    number
  red_cards:       number
}

interface AggregatedStat {
  player_id:       string
  player_name:     string
  first_name:      string | null
  last_name:       string | null
  team_name:       string
  matches_played:  number
  goals:           number
  assists:         number
  yellow_cards:    number
  red_cards:       number
}

interface Tournament {
  id:   string
  name: string
}

type SortKey = 'goals' | 'assists' | 'yellow_cards' | 'red_cards' | 'matches_played'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'goals',          label: 'Top Goal Scorers' },
  { value: 'assists',        label: 'Most Assists' },
  { value: 'yellow_cards',   label: 'Most Yellow Cards' },
  { value: 'red_cards',      label: 'Most Red Cards' },
  { value: 'matches_played', label: 'Most Appearances' },
]

export default function PlayerStatsPage() {
  const { orgId } = useAdminOrg()
  const orgGate = useAdminOrgGate()

  const [rawStats,        setRawStats]        = useState<RawStat[]>([])
  const [tournaments,     setTournaments]     = useState<Tournament[]>([])
  const [loading,         setLoading]         = useState(true)
  const [noLineups,       setNoLineups]       = useState(false)

  const [search,          setSearch]          = useState('')
  const [teamFilter,      setTeamFilter]      = useState('')
  const [tournamentFilter, setTournamentFilter] = useState('')
  const [sortKey,         setSortKey]         = useState<SortKey>('goals')

  // Fetch raw per-tournament rows + tournament list
  useEffect(() => {
    if (!orgId) return

    const fetchData = async () => {
      setLoading(true)

      const [statsRes, tournRes] = await Promise.all([
        supabase
          .from('player_stats_summary')
          .select('player_id, player_name, first_name, last_name, team_id, team_name, tournament_id, tournament_name, matches_played, goals, assists, yellow_cards, red_cards')
          .eq('organization_id', orgId),
        supabase
          .from('tournaments')
          .select('id, name')
          .eq('organization_id', orgId)
          .order('name'),
      ])

      if (statsRes.error) {
        console.error('Stats fetch error:', statsRes.error.message)
        setLoading(false)
        return
      }

      const rows = (statsRes.data || []) as RawStat[]
      setRawStats(rows)
      setTournaments((tournRes.data || []) as Tournament[])

      if (rows.length === 0) {
        const { count } = await supabase
          .from('match_lineups')
          .select('match_id', { count: 'exact', head: true })
          .limit(1)
        setNoLineups((count ?? 0) === 0)
      }

      setLoading(false)
    }

    fetchData()
  }, [orgId])

  if (orgGate) return orgGate

  const displayName = (p: { first_name: string | null; last_name: string | null; player_name: string }) => {
    if (p.first_name) {
      return p.last_name ? `${p.first_name} ${p.last_name}` : p.first_name
    }
    return p.player_name
  }

  // Filter raw rows by tournament, then aggregate per player+team
  const aggregatedStats: AggregatedStat[] = useMemo(() => {
    let filtered = rawStats

    if (tournamentFilter === '__friendly__') {
      filtered = rawStats.filter(r => r.tournament_id === null)
    } else if (tournamentFilter) {
      filtered = rawStats.filter(r => r.tournament_id === tournamentFilter)
    }

    // When showing a specific tournament (or friendlies), rows are already
    // per-player-per-team for that tournament — no further aggregation needed.
    // When "All Tournaments", aggregate across tournaments.
    if (!tournamentFilter) {
      const map = new Map<string, AggregatedStat>()
      for (const r of filtered) {
        const key = `${r.player_id}::${r.team_name}`
        const existing = map.get(key)
        if (existing) {
          existing.matches_played += r.matches_played
          existing.goals          += r.goals
          existing.assists        += r.assists
          existing.yellow_cards   += r.yellow_cards
          existing.red_cards      += r.red_cards
        } else {
          map.set(key, {
            player_id:      r.player_id,
            player_name:    r.player_name,
            first_name:     r.first_name,
            last_name:      r.last_name,
            team_name:      r.team_name,
            matches_played: r.matches_played,
            goals:          r.goals,
            assists:        r.assists,
            yellow_cards:   r.yellow_cards,
            red_cards:      r.red_cards,
          })
        }
      }
      return Array.from(map.values())
    }

    return filtered.map(r => ({
      player_id:      r.player_id,
      player_name:    r.player_name,
      first_name:     r.first_name,
      last_name:      r.last_name,
      team_name:      r.team_name,
      matches_played: r.matches_played,
      goals:          r.goals,
      assists:        r.assists,
      yellow_cards:   r.yellow_cards,
      red_cards:      r.red_cards,
    }))
  }, [rawStats, tournamentFilter])

  // Derive team list from aggregated stats (changes with tournament filter)
  const teams = useMemo(
    () => Array.from(new Set(aggregatedStats.map(r => r.team_name))).sort(),
    [aggregatedStats],
  )

  // Apply search + team filter + sort
  const filteredStats = useMemo(() => {
    const q = search.toLowerCase()
    return aggregatedStats
      .filter(p => {
        const name = displayName(p).toLowerCase()
        return name.includes(q) && (teamFilter === '' || p.team_name === teamFilter)
      })
      .sort((a, b) => b[sortKey] - a[sortKey])
  }, [aggregatedStats, search, teamFilter, sortKey])

  // Reset team filter when switching tournaments if the team no longer exists
  useEffect(() => {
    if (teamFilter && !teams.includes(teamFilter)) {
      setTeamFilter('')
    }
  }, [teams, teamFilter])

  const downloadCSV = () => {
    const tournLabel = tournamentFilter === '__friendly__'
      ? 'Friendlies'
      : tournaments.find(t => t.id === tournamentFilter)?.name || 'All Tournaments'
    const headers = ['Tournament', 'Player', 'Team', 'MP', 'Goals', 'Assists', 'Yellow Cards', 'Red Cards']
    const rows = filteredStats.map(p => [
      `"${tournLabel}"`, `"${displayName(p)}"`, `"${p.team_name}"`,
      p.matches_played, p.goals, p.assists, p.yellow_cards, p.red_cards,
    ])
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href  = URL.createObjectURL(blob)
    link.setAttribute('download', 'player_stats.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const chartType = sortKey === 'assists' ? 'assists' : 'goals'
  const topPlayers = filteredStats
    .slice(0, 5)
    .map(p => ({ ...p, player_name: displayName(p) }))

  const hasFriendlyStats = rawStats.some(r => r.tournament_id === null)

  return (
    <div className={styles.statsContainer}>
      <Link href="/admin/dashboard" className={styles.backButton}>
        &#8592; Back to Dashboard
      </Link>

      <h1 className={styles.heading}>Player Statistics</h1>
      <p className={styles.subheading}>
        View and export player performance data across all matches.
      </p>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search player name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={tournamentFilter} onChange={e => setTournamentFilter(e.target.value)}>
          <option value="">All Tournaments</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
          {hasFriendlyStats && (
            <option value="__friendly__">Friendly Matches</option>
          )}
        </select>
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
          <option value="">All Teams</option>
          {teams.map(team => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button onClick={downloadCSV}>Export CSV</button>
      </div>

      {!loading && topPlayers.length > 0 && (sortKey === 'goals' || sortKey === 'assists') && (
        <div className={styles.chartContainer}>
          <h3>Top 5 {sortKey === 'goals' ? 'Goal Scorers' : 'Assist Providers'}</h3>
          <StatsChart data={topPlayers} chartType={chartType} />
        </div>
      )}

      {loading ? (
        <div className={styles.emptyState}>Loading stats…</div>
      ) : filteredStats.length === 0 ? (
        <div className={styles.emptyState}>
          {noLineups ? (
            <>
              No lineups have been created yet.
              <br />
              <span style={{ fontSize: '0.82rem' }}>
                Add player lineups from the match editor first, then use the operator view to record goals, assists, and cards.
              </span>
            </>
          ) : tournamentFilter ? (
            'No stats found for this tournament. Try selecting a different tournament or "All Tournaments".'
          ) : (
            'No stats available yet. Player statistics will appear here once matches have been played.'
          )}
        </div>
      ) : (
        <div className={styles.tableWrapper}>
        <table className={styles.statsTable}>
          <thead>
            <tr>
              <th>Player</th>
              <th>Team</th>
              <th>MP</th>
              <th>Goals</th>
              <th>Assists</th>
              <th><YellowCard size={16} /></th>
              <th><RedCard size={16} /></th>
            </tr>
          </thead>
          <tbody>
            {filteredStats.map((p, i) => (
              <tr key={`${p.player_id}-${p.team_name}-${i}`}>
                <td>{displayName(p)}</td>
                <td>{p.team_name}</td>
                <td>{p.matches_played}</td>
                <td>{p.goals}</td>
                <td>{p.assists}</td>
                <td>{p.yellow_cards}</td>
                <td>{p.red_cards}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}
