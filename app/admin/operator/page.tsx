'use client'

// app/admin/operator/page.tsx
// Game-day match operator interface.
// Accessible by: match_operator (restricted), org_admin, power_admin.
// Shows only this org's matches for today + next 7 days, plus any live/halftime matches.
// Operator can update: score, status, match events (lineups).

import { useEffect, useState } from 'react'
import Link                    from 'next/link'
import { useRouter }           from 'next/navigation'
import { supabase }            from '@/lib/supabase'
import { useAdminOrg }         from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }     from '@/components/admin/AdminOrgGate'
import toast                   from 'react-hot-toast'

interface Match {
  id:         string
  match_date: string
  status:     'scheduled' | 'live' | 'halftime' | 'completed'
  home_score: number | null
  away_score: number | null
  home_team:  { id: string; name: string } | null
  away_team:  { id: string; name: string } | null
  tournament: { name: string } | null
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  live:      'Live',
  halftime:  'Half Time',
  completed: 'Full Time',
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#6b7280',
  live:      '#ef4444',
  halftime:  '#a855f7',
  completed: '#22c55e',
}

export default function OperatorPage() {
  const { orgId, role, orgName } = useAdminOrg()
  const orgGate = useAdminOrgGate()
  const router = useRouter()

  const [matches,  setMatches]  = useState<Match[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!orgId) return
    fetchMatches()
  }, [orgId])

  const fetchMatches = async () => {
    if (!orgId) return

    // Fetch today's matches + next 7 days + any currently live
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + 7)

    const { data, error } = await supabase
      .from('matches')
      .select(`
        id, match_date, status, home_score, away_score,
        home_team:home_team_id(id, name),
        away_team:away_team_id(id, name),
        tournament:tournament_id(name)
      `)
      .eq('organization_id', orgId)
      .or(`status.in.(live,halftime),and(match_date.gte.${from.toISOString()},match_date.lte.${to.toISOString()})`)
      .order('match_date')

    if (error) {
      toast.error('Failed to load matches')
    } else {
      setMatches(((data || []) as unknown as Match[]).map((m) => ({
        ...m,
        home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
        away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
        tournament: Array.isArray(m.tournament) ? m.tournament[0] : m.tournament,
      })))
    }
    setLoading(false)
  }

  if (orgGate) return orgGate

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1f2937', marginBottom: '0.25rem' }}>
          Game Day — {orgName}
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
          Manage live match scores and status. Showing today and next 7 days.
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Loading matches...</p>
      ) : matches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '0.9rem' }}>
          No upcoming matches in the next 7 days.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {matches.map((m) => (
            <MatchOperatorRow
              key={m.id}
              match={m}
              onUpdate={fetchMatches}
            />
          ))}
        </div>
      )}

      {/* Full match management link for org_admin+ */}
      {role !== 'match_operator' && (
        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <Link
            href="/admin/dashboard"
            style={{ fontSize: '0.82rem', color: '#6b7280' }}
          >
            ← Back to Admin Dashboard
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Individual match row with inline update controls ─────────────────────────

function MatchOperatorRow({
  match,
  onUpdate,
}: {
  match:    Match
  onUpdate: () => void
}) {
  const [homeScore, setHomeScore] = useState(match.home_score ?? 0)
  const [awayScore, setAwayScore] = useState(match.away_score ?? 0)
  const [status,    setStatus]    = useState(match.status)
  const [saving,    setSaving]    = useState(false)

  const homeName = match.home_team?.name ?? 'Home'
  const awayName = match.away_team?.name ?? 'Away'
  const isLiveish = ['live', 'halftime'].includes(status)

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('matches')
      .update({
        home_score: status === 'scheduled' ? null : homeScore,
        away_score: status === 'scheduled' ? null : awayScore,
        status,
      })
      .eq('id', match.id)

    if (error) {
      toast.error(`Update failed: ${error.message}`)
    } else {
      toast.success('Match updated')
      onUpdate()
    }
    setSaving(false)
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
      padding: '0.9rem 1.1rem',
      borderLeft: `3px solid ${STATUS_COLORS[status]}`,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.7rem' }}>
        <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
          {match.tournament?.name && <span>{match.tournament.name} · </span>}
          {new Date(match.match_date).toLocaleString('en-GB', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </div>
        <span style={{
          fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
          color: STATUS_COLORS[status],
          background: `${STATUS_COLORS[status]}18`,
          padding: '2px 7px', borderRadius: '4px',
        }}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Score row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <span style={{ flex: 1, fontWeight: 700, fontSize: '0.92rem', color: '#1f2937', textAlign: 'right' }}>
          {homeName}
        </span>

        {status !== 'scheduled' ? (
          <>
            <input
              type="number"
              min={0}
              max={99}
              value={homeScore}
              onChange={(e) => setHomeScore(Number(e.target.value))}
              style={{ width: '40px', textAlign: 'center', padding: '0.3rem', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 700, fontSize: '1rem' }}
            />
            <span style={{ color: '#9ca3af', fontWeight: 700 }}>-</span>
            <input
              type="number"
              min={0}
              max={99}
              value={awayScore}
              onChange={(e) => setAwayScore(Number(e.target.value))}
              style={{ width: '40px', textAlign: 'center', padding: '0.3rem', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 700, fontSize: '1rem' }}
            />
          </>
        ) : (
          <span style={{ padding: '0.3rem 0.75rem', color: '#9ca3af', fontSize: '0.9rem' }}>vs</span>
        )}

        <span style={{ flex: 1, fontWeight: 700, fontSize: '0.92rem', color: '#1f2937' }}>
          {awayName}
        </span>
      </div>

      {/* Status + save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Match['status'])}
          style={{ padding: '0.35rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
        >
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="halftime">Half Time</option>
          <option value="completed">Full Time</option>
        </select>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '0.35rem 0.85rem', background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.82rem',
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        {/* Detailed edit link — only for org_admin+ */}
        <Link
          href={`/admin/tournaments`}
          style={{ fontSize: '0.78rem', color: '#9ca3af', marginLeft: 'auto' }}
        >
          Full details ›
        </Link>
      </div>
    </div>
  )
}
