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

type TeamJoin  = { id: string; name: string; logo_url: string | null }
type StageJoin = { id: string; stage_name: string; order_number: number | null; stage_type: string | null }
type GroupJoin = { id: string; name: string; stage: StageJoin | StageJoin[] | null }

interface MatchRow {
  id:         string
  status:     MatchStatus
  match_date: string
  match_type: string
  home_score: number | null
  away_score: number | null
  home_team:  TeamJoin | TeamJoin[]
  away_team:  TeamJoin | TeamJoin[]
  group:      GroupJoin | GroupJoin[] | null
}

export default async function TournamentFixturesPage({ params }: Props) {
  const supabase = createServerSupabaseClient()

  let orgId = ''
  try { orgId = await getOrganizationIdServer() } catch { notFound() }

  // Single join query replaces two sequential round-trips
  const { data: tourn } = await supabase
    .from('tournaments')
    .select(`
      id, name, slug,
      matches(
        id, status, match_date, match_type, home_score, away_score,
        home_team:home_team_id(id, name, logo_url),
        away_team:away_team_id(id, name, logo_url),
        group:group_id(id, name, stage:stage_id(id, stage_name, order_number, stage_type))
      )
    `)
    .eq('slug', params.slug)
    .eq('organization_id', orgId)
    .single()

  if (!tourn) notFound()

  const matches = ((tourn.matches || []) as MatchRow[]).map((m) => {
    const group = Array.isArray(m.group) ? m.group[0] ?? null : m.group
    const stage = group
      ? (Array.isArray(group.stage) ? group.stage[0] ?? null : group.stage)
      : null
    return {
      ...m,
      home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
      away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
      group:     group ? { id: group.id, name: group.name } : null,
      stage,
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
