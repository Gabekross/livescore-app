'use client'

import { useParams } from 'next/navigation'
import TournamentStandings from '@/components/TournamentStandings'
import styles from '@/styles/components/TournamentStandingsPage.module.scss'
import Link from 'next/link'

export default function TournamentStandingsPage() {
  const { id } = useParams()

  return (
    <div className={styles.container}>
      <Link href={`/public/tournaments/${id}/stages`} className={styles.backLink}>
        ← Back to Stages
      </Link>

      <h1 className={styles.heading}>Tournament Standings</h1>

      <TournamentStandings tournamentId={id as string} stageName={''} />
    </div>
  )
}
