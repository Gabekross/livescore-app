// app/tournaments/[slug]/page.tsx
// Tournament overview — Server Component.
// Fetches by slug (SEO-friendly URL). Shows cover, stages, recent matches.

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

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const orgId   = await getOrganizationIdServer()
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('tournaments')
      .select('name, cover_image_url')
      .eq('slug', params.slug)
      .eq('organization_id', orgId)
      .single()
    return {
      title:     data?.name ?? 'Tournament',
      openGraph: { images: data?.cover_image_url ? [data.cover_image_url] : [] },
    }
  } catch {
    return { title: 'Tournament' }
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────
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

interface Stage { id: string; stage_name: string; order_number: number; show_standings: boolean }

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function TournamentDetailPage({ params }: Props) {
  const supabase = createServerSupabaseClient()

  let orgId = ''
  try { orgId = await getOrganizationIdServer() } catch { notFound() }

  // Step 1: fetch tournament by slug
  const tournRes = await supabase
    .from('tournaments')
    .select('id, name, slug, cover_image_url, start_date, end_date')
    .eq('slug', params.slug)
    .eq('organization_id', orgId)
    .single()

  if (!tournRes.data) notFound()

  const tournament = tournRes.data

  // Step 2: fetch stages + recent matches in parallel now that we have the ID
  const [stages2, matches2] = await Promise.all([
    supabase
      .from('tournament_stages')
      .select('id, stage_name, order_number, show_standings')
      .eq('tournament_id', tournament.id)
      .order('order_number'),

    supabase
      .from('matches')
      .select(`
        id, status, match_date, match_type, home_score, away_score,
        home_team:home_team_id(id, name, logo_url),
        away_team:away_team_id(id, name, logo_url)
      `)
      .eq('tournament_id', tournament.id)
      .order('match_date', { ascending: false })
      .limit(8),
  ])

  const stages  = (stages2.data  || []) as Stage[]
  const matches = ((matches2.data || []) as MatchRow[]).map((m) => ({
    ...m,
    home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
    away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
  }))

  const dateRange = [
    tournament.start_date
      ? new Date(tournament.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : null,
    tournament.end_date
      ? new Date(tournament.end_date).toLocaleDateString('en-GB',   { day: 'numeric', month: 'long', year: 'numeric' })
      : null,
  ].filter(Boolean).join(' – ')

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link href="/tournaments" className={styles.back}>← Tournaments</Link>

        {/* Header */}
        <div className={styles.tournHeader}>
          {tournament.cover_image_url && (
            <img
              src={tournament.cover_image_url}
              alt={tournament.name}
              className={styles.tournHeroImage}
            />
          )}
          <h1 className={styles.tournTitle}>{tournament.name}</h1>
          {dateRange && <p className={styles.tournMeta}>📅 {dateRange}</p>}

          <div className={styles.tournActions}>
            <Link href={`/tournaments/${params.slug}/fixtures`} className={styles.btnOutline}>
              📅 Fixtures
            </Link>
            <Link href={`/tournaments/${params.slug}/table`} className={styles.btnOutline}>
              📊 Table
            </Link>
          </div>
        </div>

        {/* Recent matches */}
        <div style={{ marginBottom: 'var(--sp-8)' }}>
          <SectionHeader
            title="Recent Matches"
            ctaLabel="All fixtures"
            ctaHref={`/tournaments/${params.slug}/fixtures`}
          />
          {matches.length === 0 ? (
            <EmptyState icon="📅" title="No matches yet" compact />
          ) : (
            <div className={styles.matchStack}>
              {matches.map((m) => (
                <MatchCard key={m.id} {...m as any} href={`/matches/${m.id}`} />
              ))}
            </div>
          )}
        </div>

        {/* Stages */}
        {stages.length > 0 && (
          <div className={styles.stagesSection}>
            <SectionHeader title="Stages" />
            {stages.map((stage) => (
              <div key={stage.id} className={styles.stageBlock}>
                <div className={styles.stageHeading}>
                  {stage.stage_name}
                  {stage.show_standings && (
                    <Link
                      href={`/tournaments/${params.slug}/table`}
                      className={styles.stageLink}
                    >
                      View table →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
