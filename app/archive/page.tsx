// app/archive/page.tsx
// Past tournaments archive — Server Component.

import type { Metadata }              from 'next'
import Link                           from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'
import SectionHeader                  from '@/components/ui/SectionHeader'
import EmptyState                     from '@/components/ui/EmptyState'
import styles                         from '@/styles/components/TournamentsPage.module.scss'

export const metadata: Metadata = {
  title:       'Archive',
  description: 'Browse past and archived tournaments.',
}

interface Tournament {
  id:              string
  name:            string
  slug:            string
  cover_image_url: string | null
  start_date:      string | null
  end_date:        string | null
}

export default async function ArchivePage() {
  let tournaments: Tournament[] = []

  try {
    const orgId   = await getOrganizationIdServer()
    const supabase = createServerSupabaseClient()

    const { data } = await supabase
      .from('tournaments')
      .select('id, name, slug, cover_image_url, start_date, end_date')
      .eq('organization_id', orgId)
      .eq('is_archived', true)
      .order('end_date', { ascending: false })

    tournaments = (data || []) as Tournament[]
  } catch {
    // DB not available
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <SectionHeader
          title="Archive"
          subtitle={`${tournaments.length} past tournament${tournaments.length !== 1 ? 's' : ''}`}
          ctaLabel="Active tournaments"
          ctaHref="/tournaments"
        />

        {tournaments.length === 0 ? (
          <EmptyState
            icon=""
            title="Archive is empty"
            description="Completed tournaments will appear here once archived."
          />
        ) : (
          <div className={styles.grid}>
            {tournaments.map((t) => {
              const dateRange = [
                t.start_date ? new Date(t.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
                t.end_date   ? new Date(t.end_date).toLocaleDateString('en-GB',   { day: 'numeric', month: 'short', year: 'numeric' }) : null,
              ].filter(Boolean).join(' – ')

              return (
                <div key={t.id} className={styles.card}>
                  {t.cover_image_url ? (
                    <img src={t.cover_image_url} alt={t.name} className={styles.cover} />
                  ) : (
                    <div className={styles.coverPlaceholder} aria-hidden="true" />
                  )}
                  <div className={styles.cardBody}>
                    <span className={styles.archiveBadge}>Archived</span>
                    <div className={styles.cardTitle}>{t.name}</div>
                    {dateRange && <div className={styles.cardMeta}>{dateRange}</div>}
                    <div className={styles.cardLinks}>
                      <Link href={`/archive/${t.slug}`}          className={styles.cardLink}>Overview →</Link>
                      <Link href={`/archive/${t.slug}/fixtures`} className={styles.cardLink}>Fixtures</Link>
                      <Link href={`/archive/${t.slug}/table`}    className={styles.cardLink}>Table</Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
