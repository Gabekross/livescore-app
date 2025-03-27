'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/TournamentList.module.scss'

interface Tournament {
  id: string
  name: string
  start_date?: string
}

export default function TournamentListPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  useEffect(() => {
    const fetchTournaments = async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('start_date', { ascending: true })

      if (error) {
        console.error('Error fetching tournaments:', error)
        return
      }

      setTournaments(data)
    }

    fetchTournaments()
  }, [])

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Tournaments</h2>
      <ul className={styles.list}>
        {tournaments.map((tournament) => (
          <li key={tournament.id} className={styles.item}>
            <Link href={`/admin/tournaments/${tournament.id}/stages`} className={styles.link}>
              <div>
                <h3>{tournament.name}</h3>
                {tournament.start_date && <p>Start Date: {new Date(tournament.start_date).toLocaleDateString()}</p>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
