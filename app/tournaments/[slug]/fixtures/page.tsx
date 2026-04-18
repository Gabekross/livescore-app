// app/tournaments/[slug]/fixtures/page.tsx
// Tournament fixtures — Server Component.

import type { Metadata }              from 'next'
import Link                           from 'next/link'
import { notFound }                   from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'
import SectionHeader                  from '@/components/ui/SectionHeader'
import TournamentFixturesList         from '@/components/ui/TournamentFixturesList'
import type { MatchStatus }           from '@/lib/utils/match'
import styles                         from '@/styles/components/TournamentsPage.module.scss'

export const revalidate = 30

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const orgId    = await getOrganizationIdServer()
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('tournaments').select('name').eq('slug', params.slug).eq('organization_id', orgId).single()
    return { title: data ? `Fixtures — ${data.name}` : 'Fixtures' }
  } catch {
    return { title: 'Fixtures' }
  }
}

export default async function TournamentFixturesPage({ params }: Props) {
  const supabase = createServerSupabaseClient()

  let orgId = ''
  try { orgId = await getOrganizationIdServer() } catch { notFound() }

  // ── Step 1: tournament ────────────────────────────────────────────────
  const { data: tourn } = await supabase
    .from('tournaments')
    .select('id, name, slug')
    .eq('slug', params.slug)
    .eq('organization_id', orgId)
    .single()

  if (!tourn) notFound()

  // ── Step 2: matches (with group name) + stages (parallel) ─────────────
  const [{ data: matchData }, { data: stagesData }] = await Promise.all([
    supabase
      .from('matches')
      .select(`
        id, status, match_date, match_type, home_score, away_score, group_id,
        home_team:home_team_id(id, name, logo_url),
        away_team:away_team_id(id, name, logo_url),
        group:group_id(id, name, stage_id)
      `)
      .eq('tournament_id', tourn.id)
      .eq('organization_id', orgId),

    supabase
      .from('tournament_stages')
      .select('id, stage_name, order_number')
      .eq('tournament_id', tourn.id)
      .order('order_number'),
  ])

  // ── Step 3: build stage lookup map then normalise matches ─────────────
  const stageMap = new Map((stagesData || []).map((s) => [s.id, s]))

  const matches = (matchData || []).map((m) => {
    const rawTeamHome = Array.isArray(m.home_team) ? m.home_team[0] : m.home_team
    const rawTeamAway = Array.isArray(m.away_team) ? m.away_team[0] : m.away_team
    const rawGroup    = Array.isArray(m.group)     ? m.group[0]     : m.group
    const stage       = rawGroup?.stage_id ? (stageMap.get(rawGroup.stage_id) ?? null) : null

    return {
      id:         m.id,
      status:     m.status as MatchStatus,
      match_date: m.match_date,
      match_type: m.match_type,
      home_score: m.home_score,
      away_score: m.away_score,
      home_team:  rawTeamHome as { id: string; name: string; logo_url: string | null },
      away_team:  rawTeamAway as { id: string; name: string; logo_url: string | null },
      group:  rawGroup  ? { id: rawGroup.id,  name: rawGroup.name }  : null,
      stage:  stage     ? { id: stage.id, stage_name: stage.stage_name, order_number: stage.order_number ?? null } : null,
    }
  })

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link href={`/tournaments/${params.slug}`} className={styles.back}>
          ← {tourn.name}
        </Link>

        <SectionHeader
          title="Fixtures & Results"
          subtitle={tourn.name}
        />

        <TournamentFixturesList
          matches={matches}
          tournamentName={tourn.name}
          tournamentSlug={params.slug}
        />
      </div>
    </div>
  )
}
