'use client'

// app/admin/matches/friendly/new/page.tsx
// Creates a friendly match between any two teams in the org.
// Friendly matches:
//   - match_type = 'friendly'
//   - affects_standings = false  (enforced by DB constraint and set explicitly here)
//   - tournament_id = null
//   - group_id = null
//
// They appear in the public matches page with a "Friendly" badge.
// They are excluded from all standings calculations.

import { useEffect, useState }  from 'react'
import { useRouter }            from 'next/navigation'
import { supabase }             from '@/lib/supabase'
import { useAdminOrg }          from '@/contexts/AdminOrgContext'
import { MATCH_STATUS_OPTIONS } from '@/lib/utils/match'
import Link                     from 'next/link'
import toast                    from 'react-hot-toast'
import styles                   from '@/styles/components/Form.module.scss'

interface Team {
  id:        string
  name:      string
  logo_url?: string
}

export default function NewFriendlyMatchPage() {
  const router  = useRouter()
  const { orgId, loading: orgLoading } = useAdminOrg()

  const [teams,     setTeams]     = useState<Team[]>([])
  const [homeTeam,  setHomeTeam]  = useState('')
  const [awayTeam,  setAwayTeam]  = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [venue,     setVenue]     = useState('')
  const [status,    setStatus]    = useState<'scheduled' | 'live' | 'halftime' | 'completed'>('scheduled')
  const [homeScore, setHomeScore] = useState<string>('')
  const [awayScore, setAwayScore] = useState<string>('')
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    if (!orgId) return
    supabase
      .from('teams')
      .select('id, name, logo_url')
      .eq('organization_id', orgId)
      .order('name')
      .then(({ data }) => setTeams(data || []))
  }, [orgId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!homeTeam || !awayTeam || homeTeam === awayTeam) {
      toast.error('Please select two different teams')
      return
    }
    if (!matchDate) {
      toast.error('Match date is required')
      return
    }

    // Validate scores are provided when status is not scheduled
    if (status !== 'scheduled' && (homeScore === '' || awayScore === '')) {
      toast.error('Please enter scores for non-scheduled matches')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('matches').insert({
      organization_id:   orgId,
      tournament_id:     null,
      group_id:          null,
      home_team_id:      homeTeam,
      away_team_id:      awayTeam,
      match_date:        matchDate,
      venue:             venue.trim() || null,
      match_type:        'friendly',
      affects_standings: false,
      status,
      home_score:        homeScore !== '' ? Number(homeScore) : null,
      away_score:        awayScore !== '' ? Number(awayScore) : null,
    })

    if (error) {
      toast.error(error.message || 'Failed to create friendly match')
    } else {
      toast.success('Friendly match created!')
      setTimeout(() => router.push('/admin/dashboard'), 800)
    }

    setLoading(false)
  }

  const inputStyle = { display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }

  if (orgLoading) return <div style={{ padding: '2rem', color: '#6b7280' }}>Loading...</div>
  if (!orgId) return <div style={{ padding: '2rem', color: '#c0392b' }}>Failed to load organization context.</div>

  return (
    <div className={styles.formContainer}>
      <Link href="/admin/dashboard" className={styles.backButton}>← Back to Dashboard</Link>

      <h2 className={styles.heading}>Create Friendly Match</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Friendly matches are shown on the fixtures page with a <strong>Friendly</strong> badge
        and are <strong>never counted in standings</strong>.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Home Team:
          <select value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} className={styles.input} required>
            <option value="">Select Home Team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Away Team:
          <select value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} className={styles.input} required>
            <option value="">Select Away Team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} disabled={t.id === homeTeam}>{t.name}</option>
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
            placeholder="e.g. Training Ground"
          />
        </label>

        <label className={styles.label}>
          Status:
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className={styles.input}
          >
            {MATCH_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        {status !== 'scheduled' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className={styles.label}>
              Home Score:
              <input
                type="number"
                min={0}
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              Away Score:
              <input
                type="number"
                min={0}
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className={styles.input}
              />
            </label>
          </div>
        )}

        <button type="submit" disabled={loading || orgLoading} className={styles.button}>
          {loading ? 'Creating…' : 'Create Friendly Match'}
        </button>
      </form>
    </div>
  )
}
