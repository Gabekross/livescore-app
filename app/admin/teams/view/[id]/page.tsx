'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/TeamView.module.scss'
import toast from 'react-hot-toast'

interface Player {
  id: string
  name: string
  jersey_number?: number
  position?: string
}

export default function TeamDetailsPage() {
  const { id } = useParams()
  const [team, setTeam] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    const fetchTeam = async () => {
      if (!id || typeof id !== 'string') return

      const { data, error } = await supabase.from('teams').select('*').eq('id', id).single()
      if (error) {
        toast.error('Team not found')
      } else {
        setTeam(data)
        fetchPlayers(data.id)
      }
    }

    const fetchPlayers = async (teamId: string) => {
      const { data, error } = await supabase.from('players').select('*').eq('team_id', teamId)
      if (error) {
        toast.error('Failed to load players')
      } else {
        setPlayers(data)
      }
    }

    fetchTeam()
  }, [id])

  if (!team) return <p>Loading...</p>

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Team Details</h2>
      {team.logo_url && (
        <img src={team.logo_url} alt={team.name} className={styles.logo} />
      )}
      <p className={styles.name}><strong>Name:</strong> {team.name}</p>

      <h3 className={styles.subheading}>Players</h3>
      {players.length === 0 ? (
        <p>No players added yet.</p>
      ) : (
        <ul className={styles.playerList}>
          {players.map((player) => (
            <li key={player.id} className={styles.playerItem}>
              <strong>{player.name}</strong>
              {player.jersey_number && <> #{player.jersey_number}</>}
              {player.position && <> – {player.position}</>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
