// app/table/page.tsx
// Public standings / league table — Server Component.
// Lets user pick a tournament and stage; renders group standings tables.

import type { Metadata }              from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'
import StandingsView                  from './StandingsView'
import EmptyState                     from '@/components/ui/EmptyState'

export const metadata: Metadata = {
  title:       'Table',
  description: 'View tournament standings and league tables.',
}

interface Tournament { id: string; name: string; slug: string }
interface Stage      { id: string; stage_name: string; tournament_id: string; show_standings: boolean }

export default async function TablePage({
  searchParams,
}: {
  searchParams: { tournament?: string; stage?: string }
}) {
  const supabase = createServerSupabaseClient()
  let orgId = ''
  let tournaments: Tournament[] = []
  let stages:      Stage[]      = []

  try {
    orgId = await getOrganizationIdServer()

    const [tourRes, stageRes] = await Promise.all([
      supabase
        .from('tournaments')
        .select('id, name, slug')
        .eq('organization_id', orgId)
        .eq('is_archived', false)
        .order('start_date', { ascending: false }),

      supabase
        .from('tournament_stages')
        .select('id, stage_name, tournament_id, show_standings')
        .eq('show_standings', true)
        .order('order_number'),
    ])

    tournaments = (tourRes.data  || []) as Tournament[]
    stages      = (stageRes.data || []) as Stage[]
  } catch {
    // DB not available
  }

  const selectedTournamentId = searchParams.tournament || tournaments[0]?.id || ''
  const stagesForTournament  = stages.filter((s) => s.tournament_id === selectedTournamentId)
  const selectedStageId      = searchParams.stage || stagesForTournament[0]?.id || ''

  if (tournaments.length === 0) {
    return (
      <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '2rem 1.25rem' }}>
          <EmptyState
            icon=""
            title="No standings available"
            description="Standings will appear here once tournament matches have been played."
          />
        </div>
      </div>
    )
  }

  return (
    <StandingsView
      orgId={orgId}
      tournaments={tournaments}
      stages={stages}
      selectedTournamentId={selectedTournamentId}
      selectedStageId={selectedStageId}
    />
  )
}
