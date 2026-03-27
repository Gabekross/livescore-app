// app/teams/[teamId]/page.tsx
// Team detail — Server Component.
// Shows team name/logo, squad list, and recent matches.

import type { Metadata }              from 'next'
import Link                           from 'next/link'
import { notFound }                   from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'
import MatchCard                      from '@/components/ui/MatchCard'
import SectionHeader                  from '@/components/ui/SectionHeader'
import EmptyState                     from '@/components/ui/EmptyState'
import type { MatchStatus }           from '@/lib/utils/match'
import styles                         from '@/styles/components/TeamsPage.module.scss'

interface Props { params: { teamId: string } }

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('teams')
      .select('name')
      .eq('id', params.teamId)
      .single()
    return { title: data?.name ?? 'Team' }
  } catch {
    return { title: 'Team' }
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Player {
  id:             string
  name:           string
  jersey_number?: number | null
}

interface MatchRow {
  id:         string
  status:     MatchStatus
  match_date: string
  match_type: string
  home_score: number | null
  away_score: number | null
  home_team:  { id: string; name: string; logo_url: string | null } | { id: string; name: string; logo_url: string | null }[]
  away_team:  { id: string; name: string; logo_url: string | null } | { id: string; name: string; logo_url: string | null }[]
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function TeamDetailPage({ params }: Props) {
  const { teamId } = params

  const supabase = createServerSupabaseClient()

  // Verify org scope
  let orgId = ''
  try {
    orgId = await getOrganizationIdServer()
  } catch {
    notFound()
  }

  const [teamRes, playersRes, matchesRes] = await Promise.all([
    supabase
      .from('teams')
      .select('id, name, logo_url')
      .eq('id', teamId)
      .eq('organization_id', orgId)
      .single(),

    supabase
      .from('players')
      .select('id, name, jersey_number')
      .eq('team_id', teamId)
      .order('jersey_number', { ascending: true, nullsFirst: false }),

    supabase
      .from('matches')
      .select(`
        id, status, match_date, match_type, home_score, away_score,
        home_team:home_team_id(id, name, logo_url),
        away_team:away_team_id(id, name, logo_url)
      `)
      .eq('organization_id', orgId)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('match_date', { ascending: false })
      .limit(10),
  ])

  if (!teamRes.data) notFound()

  const team    = teamRes.data
  const players = (playersRes.data || []) as Player[]
  const matches = ((matchesRes.data || []) as MatchRow[]).map((m) => ({
    ...m,
    home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
    away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
  }))

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link href="/teams" className={styles.back}>← All Teams</Link>

        {/* Team header */}
        <div className={styles.teamHeader}>
          {team.logo_url ? (
            <img src={team.logo_url} alt={team.name} className={styles.teamBigLogo} />
          ) : (
            <div className={styles.teamBigLogoPlaceholder}>
              {team.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className={styles.teamHeading}>{team.name}</h1>
        </div>

        {/* Squad */}
        <div className={styles.section}>
          <SectionHeader
            title="Squad"
            subtitle={`${players.length} player${players.length !== 1 ? 's' : ''}`}
          />
          {players.length === 0 ? (
            <EmptyState icon="" title="No players registered" compact />
          ) : (
            <table className={styles.playerTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className={styles.jerseyNum}>
                        {p.jersey_number ?? '–'}
                      </span>
                    </td>
                    <td>{p.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent matches */}
        <div className={styles.section}>
          <SectionHeader title="Recent Matches" />
          {matches.length === 0 ? (
            <EmptyState icon="" title="No matches played yet" compact />
          ) : (
            <div className={styles.matchStack}>
              {matches.map((m) => (
                <MatchCard
                  key={m.id}
                  {...m as any}
                  href={`/matches/${m.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
