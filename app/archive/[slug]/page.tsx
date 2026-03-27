// app/archive/[slug]/page.tsx
// Archived tournament detail — reuses the same tournament detail logic
// but sourced from the archive (is_archived = true).

import type { Metadata }              from 'next'
import Link                           from 'next/link'
import { notFound }                   from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'
import MatchCard                      from '@/components/ui/MatchCard'
import SectionHeader                  from '@/components/ui/SectionHeader'
import EmptyState                     from '@/components/ui/EmptyState'
import type { MatchStatus }           from '@/lib/utils/match'
import styles                         from '@/styles/components/TournamentsPage.module.scss'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const orgId   = await getOrganizationIdServer()
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('tournaments')
      .select('name')
      .eq('slug', params.slug)
      .eq('organization_id', orgId)
      .single()
    return { title: data ? `${data.name} (Archive)` : 'Archive' }
  } catch {
    return { title: 'Archive' }
  }
}

interface MatchRow {
  id: string; status: MatchStatus; match_date: string; match_type: string
  home_score: number | null; away_score: number | null
  home_team: { id: string; name: string; logo_url: string | null } | { id: string; name: string; logo_url: string | null }[]
  away_team: { id: string; name: string; logo_url: string | null } | { id: string; name: string; logo_url: string | null }[]
}

export default async function ArchiveTournamentPage({ params }: Props) {
  const supabase = createServerSupabaseClient()
  let orgId = ''
  try { orgId = await getOrganizationIdServer() } catch { notFound() }

  const tournRes = await supabase
    .from('tournaments')
    .select('id, name, slug, cover_image_url, start_date, end_date')
    .eq('slug', params.slug)
    .eq('organization_id', orgId)
    .single()

  if (!tournRes.data) notFound()
  const tournament = tournRes.data

  const { data: matchData } = await supabase
    .from('matches')
    .select(`
      id, status, match_date, match_type, home_score, away_score,
      home_team:home_team_id(id, name, logo_url),
      away_team:away_team_id(id, name, logo_url)
    `)
    .eq('tournament_id', tournament.id)
    .order('match_date', { ascending: false })
    .limit(20)

  const matches = ((matchData || []) as MatchRow[]).map((m) => ({
    ...m,
    home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
    away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
  }))

  const dateRange = [
    tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null,
    tournament.end_date   ? new Date(tournament.end_date).toLocaleDateString('en-GB',   { day: 'numeric', month: 'long', year: 'numeric' }) : null,
  ].filter(Boolean).join(' – ')

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link href="/archive" className={styles.back}>← Archive</Link>

        <div className={styles.tournHeader}>
          <span className={styles.archiveBadge}>Archived</span>
          {tournament.cover_image_url && (
            <img src={tournament.cover_image_url} alt={tournament.name} className={styles.tournHeroImage} />
          )}
          <h1 className={styles.tournTitle}>{tournament.name}</h1>
          {dateRange && <p className={styles.tournMeta}>{dateRange}</p>}

          <div className={styles.tournActions}>
            <Link href={`/archive/${params.slug}/fixtures`} className={styles.btnOutline}>All Fixtures</Link>
            <Link href={`/archive/${params.slug}/table`}    className={styles.btnOutline}>Table</Link>
          </div>
        </div>

        <SectionHeader title="Results" />
        {matches.length === 0 ? (
          <EmptyState icon="" title="No matches recorded" compact />
        ) : (
          <div className={styles.matchStack}>
            {matches.map((m) => (
              <MatchCard key={m.id} {...m as any} href={`/matches/${m.id}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
