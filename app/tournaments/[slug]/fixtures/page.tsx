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

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Fixtures — ${params.slug}` }
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

export default async function TournamentFixturesPage({ params }: Props) {
  const supabase = createServerSupabaseClient()

  let orgId = ''
  try { orgId = await getOrganizationIdServer() } catch { notFound() }

  const tournRes = await supabase
    .from('tournaments')
    .select('id, name, slug')
    .eq('slug', params.slug)
    .eq('organization_id', orgId)
    .single()

  if (!tournRes.data) notFound()

  const { data: matchData } = await supabase
    .from('matches')
    .select(`
      id, status, match_date, match_type, home_score, away_score,
      home_team:home_team_id(id, name, logo_url),
      away_team:away_team_id(id, name, logo_url)
    `)
    .eq('tournament_id', tournRes.data.id)
    .order('match_date')

  const matches = ((matchData || []) as MatchRow[]).map((m) => ({
    ...m,
    home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
    away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
  }))

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link href={`/tournaments/${params.slug}`} className={styles.back}>
          ← {tournRes.data.name}
        </Link>

        <SectionHeader
          title="Fixtures & Results"
          subtitle={tournRes.data.name}
        />

        <TournamentFixturesList
          matches={matches}
          tournamentName={tournRes.data.name}
          tournamentSlug={params.slug}
        />
      </div>
    </div>
  )
}
