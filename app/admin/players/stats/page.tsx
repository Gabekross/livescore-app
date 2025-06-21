'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/PlayerStatsTable.module.scss'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface PlayerStat {
  player_id: string
  name: string
  team_name: string
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
}

interface PlayerStatRecord {
  player_id: string
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  players: {
    name: string
    team_id: string
    teams: {
      name: string
    }
  }
}

export default function PlayerStatsPage() {
  const [stats, setStats] = useState<PlayerStat[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [chartType, setChartType] = useState<'goals' | 'assists'>('goals')

  const [teams, setTeams] = useState<string[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)

      const response = await supabase
        .from('player_match_stats')
        .select(`
          player_id,
          goals,
          assists,
          yellow_cards,
          red_cards,
          players:player_id (
            name,
            team_id,
            teams:team_id (
              name
            )
          )
        `) as unknown as { data: PlayerStatRecord[]; error: any }

      const { data, error } = response

      if (error) {
        console.error('Failed to load stats:', error)
        return
      }

      const grouped = new Map<string, PlayerStat>()
      const foundTeams = new Set<string>()

      for (const stat of data) {
        const id = stat.player_id
        const name = stat.players?.name || 'Unknown'
        const team_name = stat.players?.teams?.name || 'Unknown'

        foundTeams.add(team_name)

        if (!grouped.has(id)) {
          grouped.set(id, {
            player_id: id,
            name,
            team_name,
            goals: 0,
            assists: 0,
            yellow_cards: 0,
            red_cards: 0,
          })
        }

        const record = grouped.get(id)!
        record.goals += stat.goals || 0
        record.assists += stat.assists || 0
        record.yellow_cards += stat.yellow_cards || 0
        record.red_cards += stat.red_cards || 0
      }

      const sorted = Array.from(grouped.values()).sort((a, b) => b.goals - a.goals)
      setStats(sorted)
      setTeams(Array.from(foundTeams).sort())
      setLoading(false)
    }

    fetchStats()
  }, [])

  const filteredStats = stats.filter((p) => {
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (teamFilter === '' || p.team_name === teamFilter)
    )
  })

  const downloadCSV = () => {
    const headers = ['Player', 'Team', 'Goals', 'Assists', 'Yellow Cards', 'Red Cards']
    const rows = filteredStats.map((p) => [p.name, p.team_name, p.goals, p.assists, p.yellow_cards, p.red_cards])
    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
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
        <select value={chartType} onChange={(e) => setChartType(e.target.value as 'goals' | 'assists')}>
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
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip />
              <Bar dataKey={chartType} fill={chartType === 'goals' ? '#1e90ff' : '#28a745'}>
                {topPlayers.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartType === 'goals' ? '#1e90ff' : '#28a745'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {loading ? (
        <p>Loading stats...</p>
      ) : (
        <table className={styles.statsTable}>
          <thead>
            <tr>
              <th>Player</th>
              <th>Team</th>
              <th>⚽ Goals</th>
              <th>🎯 Assists</th>
              <th>🟨</th>
              <th>🟥</th>
            </tr>
          </thead>
          <tbody>
            {filteredStats.map((p) => (
              <tr key={p.player_id}>
                <td>{p.name}</td>
                <td>{p.team_name}</td>
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
