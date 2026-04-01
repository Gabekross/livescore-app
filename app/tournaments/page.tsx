// app/tournaments/page.tsx
// Public active tournaments listing — Server Component.

import type { Metadata }              from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'
import SectionHeader                  from '@/components/ui/SectionHeader'
import EmptyState                     from '@/components/ui/EmptyState'
import TournamentsGrid                from '@/components/ui/TournamentsGrid'
import type { TournamentItem }        from '@/components/ui/TournamentsGrid'
import styles                         from '@/styles/components/TournamentsPage.module.scss'

export const metadata: Metadata = {
  title:       'Tournaments',
  description: 'Browse all active tournaments.',
}

export default async function TournamentsPage() {
  let tournaments: TournamentItem[] = []

  try {
    const orgId    = await getOrganizationIdServer()
    const supabase = createServerSupabaseClient()

    const { data } = await supabase
      .from('tournaments')
      .select('id, name, slug, cover_image_url, start_date, end_date')
      .eq('organization_id', orgId)
      .eq('is_archived', false)
      .order('start_date', { ascending: false })

    tournaments = (data || []) as TournamentItem[]
  } catch {
    // DB not available — show empty state
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <SectionHeader
          title="Tournaments"
          subtitle={`${tournaments.length} active`}
          ctaLabel="View archive"
          ctaHref="/archive"
        />

        {tournaments.length === 0 ? (
          <EmptyState
            icon=""
            title="No active tournaments"
            description="Check the archive for past tournaments."
          />
        ) : (
          <TournamentsGrid tournaments={tournaments} />
        )}
      </div>
    </div>
  )
}
