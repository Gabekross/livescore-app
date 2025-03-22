'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [tournaments, setTournaments] = useState<any[]>([])

  useEffect(() => {
    const fetchTournaments = async () => {
      const { data, error } = await supabase.from('tournaments').select('*')
      if (error) console.error(error)
      else setTournaments(data)
    }

    fetchTournaments()
  }, [])

  return (
    <main>
      <h1>Live Tournaments</h1>
      <ul>
        {tournaments.map(t => (
          <li key={t.id}>{t.name}</li>
        ))}
      </ul>
    </main>
  )
}
