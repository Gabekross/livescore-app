'use client'

import { useEffect, useState }  from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase }             from '@/lib/supabase'
import { useAdminOrg }          from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }      from '@/components/admin/AdminOrgGate'
import toast                    from 'react-hot-toast'
import styles                   from '@/styles/components/Form.module.scss'
import Link                     from 'next/link'

interface Team {
  id:   string
  name: string
}

export default function NewMatchPage() {
  const { id, stageId, groupId } = useParams()
  const router  = useRouter()
  const { orgId, loading: orgLoading } = useAdminOrg()
  const orgGate = useAdminOrgGate()

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
      toast.error(error.message || 'Failed to create match')
    } else {
      toast.success('Match created')
      router.push(`/admin/tournaments/${id}/stages`)
    }

    setLoading(false)
  }

  if (orgGate) return orgGate

  return (
    <div className={styles.formContainer}>
      <Link href={`/admin/tournaments/${id}/stages`} className={styles.backButton}>
        &#8592; Back to Stages
      </Link>

      <h1 className={styles.heading}>Create New Match</h1>
      <p className={styles.subheading}>Schedule a tournament match between two teams in this group.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Match Details</div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Home Team *</label>
              <select value={teamA} onChange={(e) => setTeamA(e.target.value)} className={styles.input}>
                <option value="">Select Home Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Away Team *</label>
              <select value={teamB} onChange={(e) => setTeamB(e.target.value)} className={styles.input}>
                <option value="">Select Away Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Match Date &amp; Time *</label>
              <input
                type="datetime-local"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Venue <span className={styles.labelHint}>(optional)</span>
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className={styles.input}
                placeholder="e.g. Main Stadium"
              />
            </div>
          </div>
        </div>

        <div className={styles.buttonRow}>
          <button type="submit" className={styles.button} disabled={loading || orgLoading}>
            {loading ? 'Creating...' : 'Create Match'}
          </button>
          <Link href={`/admin/tournaments/${id}/stages`} className={styles.cancelButton}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
