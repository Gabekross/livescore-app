'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/PublicMatches.module.scss'

interface Tournament {
  id: string
  name: string
}

export default function TournamentQuickLink({
  tournamentId,
  tournaments
}: {
  tournamentId: string
  tournaments: Tournament[]
}) {
  const [stageId, setStageId] = useState<string | null>(null)

  useEffect(() => {
    const fetchStage = async () => {
      const { data, error } = await supabase
        .from('tournament_stages')
        .select('id')
        .eq('tournament_id', tournamentId)
        .order('order_number', { ascending: true })
        .limit(1)
        .single()

      if (!error && data) {
        setStageId(data.id)
      }
    }

    fetchStage()
  }, [tournamentId])

  const tournamentName = tournaments.find(t => t.id === tournamentId)?.name

  if (!stageId) return null

  return (
    <div className={styles.tournamentHeader}>
      <p>
        Viewing matches for:
        <strong style={{ marginLeft: '0.4rem' }}>{tournamentName}</strong>
      </p>
      <Link
        href={`/public/tournaments/${tournamentId}/stages/${stageId}`}
        className={styles.tournamentLink}
      >
        → View Tournament Matches & Standings
      </Link>
    </div>
  )
}
