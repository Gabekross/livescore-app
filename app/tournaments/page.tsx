// app/tournaments/page.tsx
// Public active tournaments listing — Server Component.
// Replaces old client-only version that linked to admin pages.

import type { Metadata }              from 'next'
import Link                           from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'
import SectionHeader                  from '@/components/ui/SectionHeader'
import EmptyState                     from '@/components/ui/EmptyState'
import styles                         from '@/styles/components/TournamentsPage.module.scss'

export const metadata: Metadata = {
  title:       'Tournaments',
  description: 'Browse all active tournaments.',
}

interface Tournament {
  id:              string
  name:            string
  slug:            string
  cover_image_url: string | null
  start_date:      string | null
  end_date:        string | null
}

export default async function TournamentsPage() {
  let tournaments: Tournament[] = []

  try {
    const orgId   = await getOrganizationIdServer()
    const supabase = createServerSupabaseClient()

    const { data } = await supabase
      .from('tournaments')
      .select('id, name, slug, cover_image_url, start_date, end_date')
      .eq('organization_id', orgId)
      .eq('is_archived', false)
      .order('start_date', { ascending: false })

    tournaments = (data || []) as Tournament[]
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
            icon="🏆"
            title="No active tournaments"
            description="Check the archive for past tournaments."
          />
        ) : (
          <div className={styles.grid}>
            {tournaments.map((t) => (
              <TournamentCard key={t.id} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TournamentCard({ t }: { t: Tournament }) {
  const dateRange = [
    t.start_date
      ? new Date(t.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : null,
    t.end_date
      ? new Date(t.end_date).toLocaleDateString('en-GB',   { day: 'numeric', month: 'short', year: 'numeric' })
      : null,
  ].filter(Boolean).join(' – ')

  return (
    <div className={styles.card}>
      {t.cover_image_url ? (
        <img src={t.cover_image_url} alt={t.name} className={styles.cover} />
      ) : (
        <div className={styles.coverPlaceholder}>🏆</div>
      )}
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{t.name}</div>
        {dateRange && <div className={styles.cardMeta}>📅 {dateRange}</div>}
        <div className={styles.cardLinks}>
          <Link href={`/tournaments/${t.slug}`}          className={styles.cardLink}>Overview →</Link>
          <Link href={`/tournaments/${t.slug}/fixtures`} className={styles.cardLink}>Fixtures</Link>
          <Link href={`/tournaments/${t.slug}/table`}    className={styles.cardLink}>Table</Link>
        </div>
      </div>
    </div>
  )
}
