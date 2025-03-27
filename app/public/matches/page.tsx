'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/PublicMatchList.module.scss'

interface Match {
  id: string
  match_date: string
  status: string
  venue?: string
  home_score: number | null
  away_score: number | null
  home_team: { id: string; name: string }
  away_team: { id: string; name: string }
}

export default function PublicMatchList() {
  const [matches, setMatches] = useState<Match[]>([])

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        id, match_date, venue, status,
        home_score, away_score,
        home_team:home_team_id(id, name),
        away_team:away_team_id(id, name)
      `)
      .order('match_date', { ascending: true })

    if (data) {
      const parsed = data.map((match) => ({
        ...match,
        home_team: Array.isArray(match.home_team) ? match.home_team[0] : match.home_team,
        away_team: Array.isArray(match.away_team) ? match.away_team[0] : match.away_team,
      }))
      setMatches(parsed)
    }
  }

  useEffect(() => {
    fetchMatches()

    // Optional Auto-refresh if any match is ongoing
    const interval = setInterval(() => {
      if (matches.some((m) => m.status === 'ongoing')) {
        fetchMatches()
      }
    }, 15000) // refresh every 15 seconds

    return () => clearInterval(interval)
  }, [matches])

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>⚽ All Matches</h1>

      {matches.map((match) => (
        <div key={match.id} className={styles.matchRow}>
          <span className={`${styles.status} ${match.status === 'ongoing' ? styles.live : ''}`}>
            {match.status === 'finished'
              ? 'FT'
              : match.status === 'ongoing'
              ? 'LIVE'
              : new Date(match.match_date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
          </span>
          <span className={styles.team}>{match.home_team.name}</span>
          <span className={styles.score}>{match.home_score ?? '-'} – {match.away_score ?? '-'}</span>
          <span className={styles.team}>{match.away_team.name}</span>
        </div>
      ))}
    </div>
  )
}
