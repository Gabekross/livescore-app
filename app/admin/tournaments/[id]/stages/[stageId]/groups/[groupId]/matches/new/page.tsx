'use client'

import { useEffect, useState }  from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase }             from '@/lib/supabase'
import { useOrg }               from '@/hooks/useOrg'
import toast                    from 'react-hot-toast'
import styles                   from '@/styles/components/Form.module.scss'

interface Team {
  id:   string
  name: string
}

export default function NewMatchPage() {
  const { id, stageId, groupId } = useParams()
  const router  = useRouter()
  const { orgId, loading: orgLoading } = useOrg()

  const [teams,     setTeams]     = useState<Team[]>([])
  const [teamA,     setTeamA]     = useState('')
  const [teamB,     setTeamB]     = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [venue,     setVenue]     = useState('')
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    const fetchGroupTeams = async () => {
      const { data, error } = await supabase
        .from('group_teams')
        .select('team_id, teams(id, name)')
        .eq('group_id', groupId)

      if (!error && data) {
        const parsed = data.map((entry) =>
          Array.isArray(entry.teams) ? entry.teams[0] : entry.teams
        ) as Team[]
        setTeams(parsed)
      }
    }

    fetchGroupTeams()
  }, [groupId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!orgId) {
      toast.error('Organization not loaded. Please refresh.')
      return
    }
    if (!teamA || !teamB || teamA === teamB || !matchDate) {
      toast.error('Please fill all fields and choose different teams')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('matches').insert({
      organization_id:   orgId,
      tournament_id:     id,
      group_id:          groupId,
      home_team_id:      teamA,
      away_team_id:      teamB,
      match_date:        matchDate,
      venue:             venue || null,
      match_type:        'tournament',
      affects_standings: true,
      status:            'scheduled',
    })

    if (error) {
      console.error('Match insert error:', error)
      toast.error(error.message || 'Failed to create match')
    } else {
      toast.success('Match created')
      router.push(`/admin/tournaments/${id}/stages`)
    }

    setLoading(false)
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.heading}>Create New Match</h2>

      {orgLoading && <p>Loading organization…</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Home Team:
          <select value={teamA} onChange={(e) => setTeamA(e.target.value)} className={styles.input}>
            <option value="">Select Home Team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Away Team:
          <select value={teamB} onChange={(e) => setTeamB(e.target.value)} className={styles.input}>
            <option value="">Select Away Team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Match Date &amp; Time:
          <input
            type="datetime-local"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            className={styles.input}
            required
          />
        </label>

        <label className={styles.label}>
          Venue (optional):
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className={styles.input}
            placeholder="e.g. Main Stadium"
          />
        </label>

        <button type="submit" className={styles.button} disabled={loading || orgLoading}>
          {loading ? 'Saving…' : 'Create Match'}
        </button>
      </form>
    </div>
  )
}
