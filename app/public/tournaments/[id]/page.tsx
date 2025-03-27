'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/PublicTournamentDetail.module.scss'

interface Stage {
  id: string
  stage_name: string
  order_number: number
}

interface Tournament {
  id: string
  name: string
  start_date: string
  end_date: string
  venue?: string
}

export default function PublicTournamentDetailPage() {
  const { id } = useParams()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [stages, setStages] = useState<Stage[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data: tournamentData } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single()

      const { data: stageData } = await supabase
        .from('tournament_stages')
        .select('*')
        .eq('tournament_id', id)
        .order('order_number')

      setTournament(tournamentData)
      setStages(stageData || [])
    }

    if (id) fetchData()
  }, [id])

  if (!tournament) return <p style={{ textAlign: 'center' }}>Loading tournament...</p>

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>{tournament.name}</h1>
      <p className={styles.meta}>
        📅 {tournament.start_date?.slice(0, 10)} → {tournament.end_date?.slice(0, 10)}<br />
        {tournament.venue && <>📍 {tournament.venue}</>}
      </p>

      <h2 className={styles.subheading}>Tournament Stages</h2>
      <ul className={styles.stageList}>
        {stages.map((stage) => (
          <li key={stage.id}>
            <Link href={`/public/tournaments/${id}/stages/${stage.id}`}>
              {stage.stage_name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
