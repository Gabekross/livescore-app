'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/MatchList.module.scss'
import Link from 'next/link'

interface Match {
  id: string
  match_date: string
  venue?: string
  status: string
  home_team: { id: string; name: string }
  away_team: { id: string; name: string }
}

export default function MatchListPage() {
 
  const { id, stageId, groupId } = useParams()

  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          venue,
          status,
          home_team:home_team_id(id, name),
          away_team:away_team_id(id, name)
        `)
        .eq('group_id', groupId)
        .order('match_date')

        if (!error && data) {
          const parsed = data.map((match) => ({
            ...match,
            home_team: Array.isArray(match.home_team) ? match.home_team[0] : match.home_team,
            away_team: Array.isArray(match.away_team) ? match.away_team[0] : match.away_team,
          }))
        
          setMatches(parsed)
        }
        
    }

    fetchMatches()
  }, [groupId])

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Matches in Group</h2>
      {matches.length === 0 ? (
        <p>No matches scheduled yet.</p>
      ) : (
        <ul className={styles.matchList}>
          {matches.map((match) => (
            <li key={match.id} className={styles.matchItem}>
              <div className={styles.teams}>
                {match.home_team.name} vs {match.away_team.name}
              </div>
              <div className={styles.details}>
                📅 {new Date(match.match_date).toLocaleString()}<br />
                📍 {match.venue || 'TBD'}<br />
                📌 Status: {match.status}
              </div>
              <div className={styles.actions}>
      <Link
        href={`/admin/tournaments/${id}/stages/${stageId}/groups/${groupId}/matches/${match.id}/edit`}
      >
        ✏️ Edit Match
      </Link>
    </div>
              
            </li>
            
          ))}
        </ul>
      )}
    </div>
  )
}
