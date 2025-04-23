'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/StandingsTable.module.scss'

interface StandingRow {
  team_id: string
  team_name: string
  played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
}

export default function GroupStandings({ groupId }: { groupId: string }) {
  const [standings, setStandings] = useState<StandingRow[]>([])

  const fetchAndSetStandings = async () => {
    const { data, error } = await supabase.rpc('get_group_standings', {
      group_input: groupId,
    })

    if (!error) {
      setStandings(data)
    } else {
      console.error('Error loading group standings:', error)
    }
  }

  useEffect(() => {
    if (!groupId) return
    fetchAndSetStandings()

    const channel = supabase
      .channel(`group-standings-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          fetchAndSetStandings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  if (!standings.length) return <p>No results yet.</p>

  return (
    <div className={styles.standingsContainer}>
      <h4 className={styles.heading}>Standings</h4>
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
            <th>PTS</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, idx) => (
            <tr key={team.team_id}>
              <td>{idx + 1}</td>
              <td>{team.team_name}</td>
              <td>{team.played}</td>
              <td>{team.wins}</td>
              <td>{team.draws}</td>
              <td>{team.losses}</td>
              <td>{team.goals_for}</td>
              <td>{team.goals_against}</td>
              <td>{team.goal_difference}</td>
              <td>{team.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
