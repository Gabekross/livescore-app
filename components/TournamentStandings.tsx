'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/TournamentStandings.module.scss'

interface Standing {
  team_id: string
  team_name: string
  mp: number
  w: number
  d: number
  l: number
  gf: number
  ga: number
  gd: number
  pts: number
}

export default function TournamentStandings({
  tournamentId,
  selectedStageName,
}: {
  tournamentId: string
  selectedStageName: string
}) {
  const [standings, setStandings] = useState<Standing[]>([])
  const [isLive, setIsLive] = useState(true)

  const fetchAndSetStandings = async () => {
    const { data: stages } = await supabase
      .from('tournament_stages')
      .select('id')
      .eq('tournament_id', tournamentId)

    const stageIds = stages?.map((s) => s.id) || []
    if (stageIds.length === 0) return

    const { data: groups } = await supabase
      .from('groups')
      .select('id')
      .in('stage_id', stageIds)

    const groupIds = groups?.map((g) => g.id) || []
    if (groupIds.length === 0) return

    const { data: matches } = await supabase
      .from('matches')
      .select(`
        id,
        group_id,
        status,
        home_team_id,
        away_team_id,
        home_score,
        away_score
      `)
      .in('group_id', groupIds)
      .neq('status', 'scheduled')

    const { data: teams } = await supabase
      .from('teams')
      .select('id, name')

    const teamMap: Record<string, string> = {}
    teams?.forEach((t) => {
      teamMap[t.id] = t.name
    })

    const temp: Record<string, Standing> = {}

    matches?.forEach((m) => {
      if (m.home_score === null || m.away_score === null) return

      const homeId = m.home_team_id
      const awayId = m.away_team_id

      const home = temp[homeId] ?? {
        team_id: homeId,
        team_name: teamMap[homeId] ?? `Team ${homeId.slice(0, 4)}`,
        mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0,
      }

      const away = temp[awayId] ?? {
        team_id: awayId,
        team_name: teamMap[awayId] ?? `Team ${awayId.slice(0, 4)}`,
        mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0,
      }

      home.mp += 1
      away.mp += 1

      home.gf += m.home_score
      home.ga += m.away_score
      away.gf += m.away_score
      away.ga += m.home_score

      if (m.home_score > m.away_score) {
        home.w += 1
        away.l += 1
        home.pts += 3
      } else if (m.home_score < m.away_score) {
        away.w += 1
        home.l += 1
        away.pts += 3
      } else {
        home.d += 1
        away.d += 1
        home.pts += 1
        away.pts += 1
      }

      home.gd = home.gf - home.ga
      away.gd = away.gf - away.ga

      temp[homeId] = home
      temp[awayId] = away
    })

    const sorted = Object.values(temp).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts
      if (b.gd !== a.gd) return b.gd - a.gd
      return b.gf - a.gf
    })

    setStandings(sorted)
  }

  useEffect(() => {
    setIsLive(selectedStageName === 'QQQ')
  }, [selectedStageName])

  useEffect(() => {
    fetchAndSetStandings()

    if (!isLive) return

    const channel = supabase
      .channel('realtime-tournament-standings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches',
      }, () => fetchAndSetStandings())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tournamentId, isLive])

  const title = isLive ? '🏆 Tournament Standings' : '📌 Final Preliminaries Standings'

  if (standings.length === 0) {
    return <p style={{ color: 'gray', textAlign: 'center' }}>{title} not available yet.</p>
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>{title}</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>MP</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GF</th>
            <th>GA</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, idx) => (
            <tr key={team.team_id}>
              <td>{idx + 1}</td>
              <td>{team.team_name}</td>
              <td>{team.mp}</td>
              <td>{team.w}</td>
              <td>{team.d}</td>
              <td>{team.l}</td>
              <td>{team.gf}</td>
              <td>{team.ga}</td>
              <td>{team.gd}</td>
              <td>{team.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
