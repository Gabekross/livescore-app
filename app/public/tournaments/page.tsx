'use client'

import { useEffect, useState } from 'react'
import Link                    from 'next/link'
import { supabase }            from '@/lib/supabase'
import { getOrganizationId }   from '@/lib/org'
import styles                  from '@/styles/components/PublicTournamentList.module.scss'

interface Tournament {
  id:          string
  name:        string
  slug:        string
  start_date:  string
  end_date:    string
  venue?:      string
  is_archived: boolean
}

const today = new Date().toISOString().slice(0, 10)

export default function PublicTournamentList() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  useEffect(() => {
    const fetchTournaments = async () => {
      const orgId = await getOrganizationId()

      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, slug, start_date, end_date, venue, is_archived')
        .eq('organization_id', orgId)
        .eq('is_archived', false)
        .order('start_date', { ascending: false })

      if (!error && data) setTournaments(data)
    }

    fetchTournaments()
  }, [])

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>⚽ Tournaments</h1>

      {tournaments.length === 0 ? (
        <p>No tournaments available.</p>
      ) : (
        <ul className={styles.tournamentList}>
          {tournaments.map((tournament) => {
            const isOngoing =
              tournament.start_date <= today && tournament.end_date >= today

            return (
              <li key={tournament.id} className={styles.tournamentItem}>
                <div className={styles.info}>
                  <Link href={`/public/tournaments/${tournament.id}`}>
                    <strong>{tournament.name}</strong>
                  </Link>
                  {isOngoing && <span className={styles.badge}>LIVE NOW</span>}
                  <div className={styles.meta}>
                    📅 {tournament.start_date?.slice(0, 10)} → {tournament.end_date?.slice(0, 10)}
                    {tournament.venue && <> | 📍 {tournament.venue}</>}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
