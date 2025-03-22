'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
    <div>
      <h1>Admin – Tournaments</h1>
      <Link href="/admin/tournaments/new">➕ Add New Tournament</Link>
      <ul>
        {tournaments.map(t => (
          <li key={t.id}>
            {t.name} ({t.start_date?.slice(0, 10)} → {t.end_date?.slice(0, 10)})
          </li>
        ))}
      </ul>
    </div>
  )
}
