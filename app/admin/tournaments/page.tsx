'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import styles from '@/styles/components/TournamentList.module.scss'

export default function AdminTournamentList() {
  const [tournaments, setTournaments] = useState<any[]>([])

  useEffect(() => {
    const fetchTournaments = async () => {
      const { data, error } = await supabase.from('tournaments').select('*').order('start_date')
      if (!error) setTournaments(data)
    }

    fetchTournaments()
  }, [])

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Admin – Tournaments</h1>

      <Link href="/admin/tournaments/new" className={styles.newButton}>
        ➕ Add New Tournament
      </Link>

      <ul className={styles.list}>
        {tournaments.map(t => (
          <li key={t.id} className={styles.item}>
            <Link href={`/admin/tournaments/${t.id}/stages`} className={styles.link}>
              <div>
                <h3>{t.name}</h3>
                <p>{t.start_date?.slice(0, 10)} → {t.end_date?.slice(0, 10)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
