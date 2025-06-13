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

  const handleDelete = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return

    const { error } = await supabase.from('matches').delete().eq('id', matchId)

    if (error) {
      console.error('Error deleting match:', error.message)
      alert('Failed to delete match.')
    } else {
      setMatches((prev) => prev.filter((m) => m.id !== matchId))
    }
  }

  return (
    <div className={styles.container}>
      <Link href={`/admin/tournaments/${id}/stages`} className={styles.backButton}>
        ← Back to Stages
      </Link>
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
                <button
                  onClick={() => handleDelete(match.id)}
                  className={styles.deleteButton}
                >
                  🗑️ Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
