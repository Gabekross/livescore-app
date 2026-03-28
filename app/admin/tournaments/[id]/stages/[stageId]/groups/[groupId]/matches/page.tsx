'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/MatchList.module.scss'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAdminOrg } from '@/contexts/AdminOrgContext'
import { useAdminOrgGate } from '@/components/admin/AdminOrgGate'

interface Match {
  id: string
  match_date: string
  venue?: string
  status: string
  home_team: { id: string; name: string }
  away_team: { id: string; name: string }
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  scheduled: { bg: 'rgba(156,163,175,0.1)', color: '#6b7280', border: 'rgba(156,163,175,0.3)' },
  live:      { bg: 'rgba(239,68,68,0.08)',   color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
  halftime:  { bg: 'rgba(168,85,247,0.08)',  color: '#7c3aed', border: 'rgba(168,85,247,0.2)' },
  completed: { bg: 'rgba(34,197,94,0.12)',   color: '#16a34a', border: 'rgba(34,197,94,0.3)' },
}

export default function MatchListPage() {
  const { id, stageId, groupId } = useParams()
  const { orgId } = useAdminOrg()
  const orgGate = useAdminOrgGate()
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    if (!orgId) return
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
  }, [groupId, orgId])

  const handleDelete = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return

    const { error } = await supabase.from('matches').delete().eq('id', matchId)

    if (error) {
      toast.error('Failed to delete match')
    } else {
      toast.success('Match deleted')
      setMatches((prev) => prev.filter((m) => m.id !== matchId))
    }
  }

  if (orgGate) return orgGate

  return (
    <div className={styles.container}>
      <Link href={`/admin/tournaments/${id}/stages`} className={styles.backButton}>
        &#8592; Back to Stages
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className={styles.heading}>Group Matches</h1>
          <p className={styles.subheading}>Manage fixtures and results for this group.</p>
        </div>
        <Link
          href={`/admin/tournaments/${id}/stages/${stageId}/groups/${groupId}/matches/new`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4em',
            padding: '0.6rem 1.2rem', backgroundColor: '#2563eb', color: '#fff',
            borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          + New Match
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className={styles.emptyState}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>
            No matches scheduled yet
          </p>
          <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
            Create a match to schedule a fixture for this group.
          </p>
        </div>
      ) : (
        <ul className={styles.matchList}>
          {matches.map((match) => {
            const statusStyle = STATUS_STYLES[match.status] || STATUS_STYLES.scheduled
            return (
              <li key={match.id} className={styles.matchItem}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div className={styles.teams}>
                    {match.home_team.name} vs {match.away_team.name}
                  </div>
                  <span style={{
                    display: 'inline-flex', padding: '2px 10px', borderRadius: '9999px',
                    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`,
                  }}>
                    {match.status}
                  </span>
                </div>
                <div className={styles.details}>
                  {new Date(match.match_date).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                  {match.venue && ` · ${match.venue}`}
                </div>
                <div className={styles.actions}>
                  <Link href={`/admin/tournaments/${id}/stages/${stageId}/groups/${groupId}/matches/${match.id}/edit`}>
                    Edit Match
                  </Link>
                  <Link href={`/admin/matches/${match.id}/formation-editor`}>
                    Formation
                  </Link>
                  <button onClick={() => handleDelete(match.id)} className={styles.deleteButton}>
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
