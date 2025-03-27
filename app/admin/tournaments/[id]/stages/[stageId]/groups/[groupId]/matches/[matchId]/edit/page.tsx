'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import styles from '@/styles/components/MatchEdit.module.scss'

export default function EditMatchPage() {
  const { matchId, id, stageId, groupId } = useParams()
  const router = useRouter()

  const [homeTeam, setHomeTeam] = useState('')
  const [awayTeam, setAwayTeam] = useState('')
  const [homeScore, setHomeScore] = useState<number | null>(null)
  const [awayScore, setAwayScore] = useState<number | null>(null)
  const [status, setStatus] = useState('scheduled')
  const [loading, setLoading] = useState(false)
  const [isLoadingMatch, setIsLoadingMatch] = useState(true)

  useEffect(() => {
    const fetchMatch = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          home_score,
          away_score,
          status,
          home_team:home_team_id(id, name),
          away_team:away_team_id(id, name)
        `)
        .eq('id', matchId)
        .single()

      if (error || !data) {
        toast.error('Error loading match')
        return
      }

      const home = Array.isArray(data.home_team) ? data.home_team[0] : data.home_team
      const away = Array.isArray(data.away_team) ? data.away_team[0] : data.away_team

      setHomeTeam(home?.name || '')
      setAwayTeam(away?.name || '')
      setHomeScore(data.home_score ?? 0)
      setAwayScore(data.away_score ?? 0)
      setStatus(data.status ?? 'scheduled')
      setIsLoadingMatch(false)
    }

    if (matchId) fetchMatch()
  }, [matchId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (homeScore === null || awayScore === null || !status) {
      toast.error('Please fill in all fields.')
      return
    }

    setLoading(true)

    console.log('Submitting match update:', {
      home_score: homeScore,
      away_score: awayScore,
      status: status || 'scheduled'
    })

    const { error } = await supabase
      .from('matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: status || 'scheduled'
      })
      .eq('id', matchId)

    if (error) {
      console.error('Update error:', error)
      toast.error(error.message || 'Failed to update match')
    } else {
      toast.success('Match updated!')
      setTimeout(() => {
        router.push(`/admin/tournaments/${id}/stages/${stageId}/groups/${groupId}/matches`)
      }, 1000)
    }

    setLoading(false)
  }

  if (isLoadingMatch) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading match...</p>
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Edit Match</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div>
          <label className={styles.label}>Home Team:</label>
          <p className={styles.readOnlyValue}>{homeTeam}</p>
        </div>

        <div>
          <label className={styles.label}>Away Team:</label>
          <p className={styles.readOnlyValue}>{awayTeam}</p>
        </div>

        <div>
          <label className={styles.label}>Home Score:</label>
          <input
            type="number"
            value={homeScore ?? ''}
            onChange={(e) => setHomeScore(Number(e.target.value))}
            required
            className={styles.input}
          />
        </div>

        <div>
          <label className={styles.label}>Away Score:</label>
          <input
            type="number"
            value={awayScore ?? ''}
            onChange={(e) => setAwayScore(Number(e.target.value))}
            required
            className={styles.input}
          />
        </div>

        <div>
          <label className={styles.label}>Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={styles.select}
            required
          >
       
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="finished">Finished</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Updating...' : 'Update Match'}
        </button>
      </form>
    </div>
  )
}
