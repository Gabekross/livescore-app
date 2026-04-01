'use client'

import { useState, useMemo } from 'react'
import Link                   from 'next/link'
import EmptyState             from '@/components/ui/EmptyState'
import styles                 from '@/styles/components/TournamentsPage.module.scss'

export interface TournamentItem {
  id:              string
  name:            string
  slug:            string
  cover_image_url: string | null
  start_date:      string | null
  end_date:        string | null
}

interface Props {
  tournaments: TournamentItem[]
}

export default function TournamentsGrid({ tournaments }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tournaments
    return tournaments.filter((t) => t.name.toLowerCase().includes(q))
  }, [query, tournaments])

  return (
    <>
      <div className={styles.searchWrap}>
        <input
          type="text"
          placeholder="Search tournaments\u2026"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon=""
          title="No tournaments found"
          description={query ? 'Try a different search term.' : 'Check the archive for past tournaments.'}
        />
      ) : (
        <div className={styles.grid}>
          {filtered.map((t) => (
            <TournamentCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </>
  )
}

function TournamentCard({ t }: { t: TournamentItem }) {
  const dateRange = [
    t.start_date
      ? new Date(t.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : null,
    t.end_date
      ? new Date(t.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : null,
  ].filter(Boolean).join(' \u2013 ')

  return (
    <div className={styles.card}>
      {t.cover_image_url ? (
        <img src={t.cover_image_url} alt={t.name} className={styles.cover} />
      ) : (
        <div className={styles.coverPlaceholder} aria-hidden="true" />
      )}
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{t.name}</div>
        {dateRange && <div className={styles.cardMeta}>{dateRange}</div>}
        <div className={styles.cardLinks}>
          <Link href={`/tournaments/${t.slug}`}          className={styles.cardLink}>Overview &rarr;</Link>
          <Link href={`/tournaments/${t.slug}/fixtures`} className={styles.cardLink}>Fixtures</Link>
          <Link href={`/tournaments/${t.slug}/table`}    className={styles.cardLink}>Table</Link>
        </div>
      </div>
    </div>
  )
}
