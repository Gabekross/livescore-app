'use client'

// app/admin/players/stats/page.tsx
// Queries the player_stats_summary view (migration 017) instead of the old
// player_match_stats table which no longer exists in the new schema.

import { useEffect, useState }   from 'react'
import { supabase }              from '@/lib/supabase'
import { useOrg }                from '@/hooks/useOrg'
import styles                    from '@/styles/components/PlayerStatsTable.module.scss'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface PlayerStat {
  player_id:     string
  player_name:   string
  team_name:     string
  matches_played: number
  goals:         number
  assists:       number
  yellow_cards:  number
  red_cards:     number
}

export default function PlayerStatsPage() {
  const { orgId } = useOrg()

  const [stats,      setStats]      = useState<PlayerStat[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [chartType,  setChartType]  = useState<'goals' | 'assists'>('goals')
  const [teams,      setTeams]      = useState<string[]>([])

  useEffect(() => {
    if (!orgId) return

    const fetchStats = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('player_stats_summary')
        .select('player_id, player_name, team_name, matches_played, goals, assists, yellow_cards, red_cards')
        .eq('organization_id', orgId)
        .order('goals', { ascending: false })

      if (error) {
        console.error('Failed to load stats:', error)
        setLoading(false)
        return
      }

      const rows = (data || []) as PlayerStat[]
      setStats(rows)
      setTeams(Array.from(new Set(rows.map((r) => r.team_name))).sort())
      setLoading(false)
    }

    fetchStats()
  }, [orgId])

  const filteredStats = stats.filter((p) =>
    p.player_name.toLowerCase().includes(search.toLowerCase()) &&
    (teamFilter === '' || p.team_name === teamFilter)
  )

  const downloadCSV = () => {
    const headers = ['Player', 'Team', 'MP', 'Goals', 'Assists', 'Yellow Cards', 'Red Cards']
    const rows = filteredStats.map((p) => [
      p.player_name, p.team_name, p.matches_played, p.goals, p.assists, p.yellow_cards, p.red_cards,
    ])
    const csv  = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href  = URL.createObjectURL(blob)
    link.setAttribute('download', 'player_stats.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const topPlayers = [...filteredStats]
    .sort((a, b) => (chartType === 'goals' ? b.goals - a.goals : b.assists - a.assists))
    .slice(0, 5)

  return (
    <div className={styles.statsContainer}>
      <h2>Player Statistics</h2>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search player name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
          <option value="">All Teams</option>
          {teams.map((team) => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
        <button onClick={downloadCSV}>⬇ Export CSV</button>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value as 'goals' | 'assists')}
        >
          <option value="goals">Top Goal Scorers</option>
          <option value="assists">Top Assist Providers</option>
        </select>
      </div>

      {!loading && topPlayers.length > 0 && (
        <div className={styles.chartContainer}>
          <h3>Top 5 {chartType === 'goals' ? 'Goal Scorers' : 'Assist Providers'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPlayers} layout="vertical" margin={{ left: 40, right: 20 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="player_name" type="category" width={120} />
              <Tooltip />
              <Bar dataKey={chartType} fill={chartType === 'goals' ? '#1e90ff' : '#28a745'}>
                {topPlayers.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={chartType === 'goals' ? '#1e90ff' : '#28a745'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {loading ? (
        <p>Loading stats…</p>
      ) : filteredStats.length === 0 ? (
        <p>No stats available yet.</p>
      ) : (
        <table className={styles.statsTable}>
          <thead>
            <tr>
              <th>Player</th>
              <th>Team</th>
              <th>MP</th>
              <th>⚽ Goals</th>
              <th>🎯 Assists</th>
              <th>🟨</th>
              <th>🟥</th>
            </tr>
          </thead>
          <tbody>
            {filteredStats.map((p) => (
              <tr key={p.player_id}>
                <td>{p.player_name}</td>
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
      )}
    </div>
  )
}
