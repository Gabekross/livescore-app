// app/archive/[slug]/table/page.tsx
// Archived tournament standings — reuses StandingsView client component.

import type { Metadata }              from 'next'
import Link                           from 'next/link'
import { notFound }                   from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'
import StandingsView                  from '@/app/table/StandingsView'
import EmptyState                     from '@/components/ui/EmptyState'
import styles                         from '@/styles/components/TournamentsPage.module.scss'

interface Props {
  params:       { slug: string }
  searchParams: { stage?: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Table — ${params.slug} (Archive)` }
}

export default async function ArchiveTablePage({ params, searchParams }: Props) {
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
  const tourn = tournRes.data

  const { data: stagesData } = await supabase
    .from('tournament_stages')
    .select('id, stage_name, tournament_id, show_standings, order_number')
    .eq('tournament_id', tourn.id)
    .eq('show_standings', true)
    .order('order_number')

  const stages = stagesData || []

  if (stages.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <Link href={`/archive/${params.slug}`} className={styles.back}>
            ← {tourn.name}
          </Link>
          <EmptyState icon="" title="No standings available" />
        </div>
      </div>
    )
  }

  const selectedStageId = searchParams.stage || stages[0]?.id || ''

  return (
    <div style={{ paddingTop: 'var(--nav-height)' }}>
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: 'var(--sp-4) var(--content-padding) 0' }}>
        <Link href={`/archive/${params.slug}`} className={styles.back}>
          ← {tourn.name}
        </Link>
      </div>
      <StandingsView
        orgId={orgId}
        tournaments={[tourn]}
        stages={stages as any}
        selectedTournamentId={tourn.id}
        selectedStageId={selectedStageId}
      />
    </div>
  )
}
