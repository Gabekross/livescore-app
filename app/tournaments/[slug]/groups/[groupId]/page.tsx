// app/tournaments/[slug]/groups/[groupId]/page.tsx
// Group detail — shows all matches (every status) for a single group,
// plus the group standings table.

import type { Metadata }              from 'next'
import Link                           from 'next/link'
import { notFound }                   from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'
import MatchCard                      from '@/components/ui/MatchCard'
import GroupStandings                 from '@/components/GroupStandings'
import SectionHeader                  from '@/components/ui/SectionHeader'
import EmptyState                     from '@/components/ui/EmptyState'
import type { MatchStatus }           from '@/lib/utils/match'
import styles                         from '@/styles/components/TournamentsPage.module.scss'

interface Props { params: { slug: string; groupId: string } }

// ── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const orgId    = await getOrganizationIdServer()
    const supabase = createServerSupabaseClient()

    const [{ data: tourn }, { data: group }] = await Promise.all([
      supabase
        .from('tournaments')
        .select('name')
        .eq('slug', params.slug)
        .eq('organization_id', orgId)
        .single(),
      supabase.from('groups').select('name').eq('id', params.groupId).single(),
    ])

    const title = [group?.name, tourn?.name].filter(Boolean).join(' — ')
    return { title: title || 'Group' }
  } catch {
    return { title: 'Group' }
  }
}

// ── Types ────────────────────────────────────────────────────────────────────
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function GroupMatchesPage({ params }: Props) {
  const supabase = createServerSupabaseClient()

  let orgId = ''
  try { orgId = await getOrganizationIdServer() } catch { notFound() }

  // Verify tournament belongs to this org
  const tournRes = await supabase
    .from('tournaments')
    .select('id, name, slug')
    .eq('slug', params.slug)
    .eq('organization_id', orgId)
    .single()

  if (!tournRes.data) notFound()

  // Fetch group info
  const groupRes = await supabase
    .from('groups')
    .select('id, name, stage_id')
    .eq('id', params.groupId)
    .single()

  if (!groupRes.data) notFound()

  const group = groupRes.data

  // Verify group belongs to this tournament (via its stage)
  const stageRes = await supabase
    .from('tournament_stages')
    .select('id, stage_name, show_standings')
    .eq('id', group.stage_id)
    .eq('tournament_id', tournRes.data.id)
    .single()

  if (!stageRes.data) notFound()

  // Fetch ALL matches for this group (every status)
  const { data: matchData } = await supabase
    .from('matches')
    .select(`
      id, status, match_date, match_type, home_score, away_score,
      home_team:home_team_id(id, name, logo_url),
      away_team:away_team_id(id, name, logo_url)
    `)
    .eq('group_id', params.groupId)
    .order('match_date')

  const matches = ((matchData || []) as MatchRow[]).map((m) => ({
    ...m,
    home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
    away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
  }))

  // Group matches by date
  const grouped = new Map<string, typeof matches>()
  for (const m of matches) {
    const key = m.match_date.slice(0, 10)
    grouped.set(key, [...(grouped.get(key) ?? []), m])
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link href={`/tournaments/${params.slug}`} className={styles.back}>
          ← {tournRes.data.name}
        </Link>

        <SectionHeader
          title={group.name}
          subtitle={`${stageRes.data.stage_name} — ${tournRes.data.name}`}
        />

        {/* Standings */}
        {stageRes.data.show_standings && (
          <div className={styles.stageBlock} style={{ marginBottom: 'var(--sp-6, 1.5rem)' }}>
            <div className={styles.stageHeading}>Standings</div>
            <div style={{ padding: 'var(--sp-4, 1rem) var(--sp-5, 1.25rem)' }}>
              <GroupStandings groupId={params.groupId} />
            </div>
          </div>
        )}

        {/* Matches */}
        <SectionHeader title="Matches" subtitle={`${matches.length} match${matches.length !== 1 ? 'es' : ''}`} />

        {matches.length === 0 ? (
          <EmptyState title="No matches scheduled yet" />
        ) : (
          Array.from(grouped.entries()).map(([date, dayMatches]) => (
            <div key={date} className={styles.dateGroup}>
              <div className={styles.dateLabel}>
                {(() => {
                  const d = new Date(date + 'T00:00:00')
                  const opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }
                  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric'
                  return d.toLocaleDateString('en-GB', opts)
                })()}
              </div>
              <div className={styles.matchStack}>
                {dayMatches.map((m) => (
                  <MatchCard key={m.id} {...m as any} href={`/matches/${m.id}`} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
