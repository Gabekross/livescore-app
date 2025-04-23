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

export default function TournamentStandings({ tournamentId }: { tournamentId: string }) {
  const [standings, setStandings] = useState<Standing[]>([])

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

    const { data: rows } = await supabase
      .from('group_standings')
      .select('*')
      .in('group_id', groupIds)

    const merged: Record<string, Standing> = {}
    rows?.forEach((s) => {
      if (!merged[s.team_id]) {
        merged[s.team_id] = {
          team_id: s.team_id,
          team_name: s.team_name,
          mp: s.played,
          w: s.wins,
          d: s.draws,
          l: s.losses,
          gf: s.goals_for,
          ga: s.goals_against,
          gd: s.goal_difference,
          pts: s.points,
        }
      } else {
        const team = merged[s.team_id]
        team.mp += s.played
        team.w += s.wins
        team.d += s.draws
        team.l += s.losses
        team.gf += s.goals_for
        team.ga += s.goals_against
        team.gd = team.gf - team.ga
        team.pts += s.points
      }
    })

    const sorted = Object.values(merged).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts
      if (b.gd !== a.gd) return b.gd - a.gd
      return b.gf - a.gf
    })

    setStandings(sorted)
  }

  useEffect(() => {
    if (!tournamentId) return
    fetchAndSetStandings()

    const channel = supabase
      .channel(`tournament-standings-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          fetchAndSetStandings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tournamentId])

  if (standings.length === 0) {
    return <p style={{ color: 'gray', textAlign: 'center' }}>Tournament standings not available yet.</p>
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>🏆 Tournament Standings</h2>
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
