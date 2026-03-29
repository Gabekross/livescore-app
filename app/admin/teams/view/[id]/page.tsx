'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAdminOrg }     from '@/contexts/AdminOrgContext'
import { useAdminOrgGate } from '@/components/admin/AdminOrgGate'
import styles from '@/styles/components/TeamView.module.scss'
import toast from 'react-hot-toast'
import { positionLabel } from '@/lib/constants/positions'

interface Player {
  id: string
  name: string
  jersey_number?: number
  position?: string
}

export default function TeamDetailsPage() {
  const { id } = useParams()
  const { orgId } = useAdminOrg()
  const orgGate = useAdminOrgGate()
  const [team, setTeam] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    const fetchTeam = async () => {
      if (!id || typeof id !== 'string' || !orgId) return

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .eq('organization_id', orgId)
        .single()
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
  }, [id, orgId])

  if (orgGate) return orgGate
  if (!team) return <div style={{ padding: '2rem', color: '#9ca3af' }}>Loading team...</div>

  return (
    <div className={styles.container}>
      <Link href="/admin/teams" className={styles.backButton}>
        &#8592; Back to Teams
      </Link>

      <h1 className={styles.heading}>Team Details</h1>

      <div className={styles.teamCard}>
        {team.logo_url ? (
          <img src={team.logo_url} alt={team.name} className={styles.logo} />
        ) : (
          <div className={styles.logoPlaceholder}>&#9917;</div>
        )}
        <div>
          <div className={styles.name}>{team.name}</div>
          {team.coach_name && (
            <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Coach: {team.coach_name}
            </div>
          )}
        </div>
      </div>

      <div className={styles.playerSection}>
        <h3 className={styles.subheading}>Players ({players.length})</h3>

        {players.length === 0 ? (
          <div className={styles.emptyState}>
            No players added yet. Edit the team to add players.
          </div>
        ) : (
          <ul className={styles.playerList}>
            {players.map((player) => (
              <li key={player.id} className={styles.playerItem}>
                {player.jersey_number != null && (
                  <span className={styles.playerNumber}>#{player.jersey_number}</span>
                )}
                <strong>{player.name}</strong>
                {player.position && (
                  <span className={styles.playerPosition}>{positionLabel(player.position)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.actions}>
        <Link
          href={`/admin/teams/edit/${id}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4em',
            padding: '0.6rem 1.2rem', backgroundColor: '#2563eb', color: '#fff',
            borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem',
            textDecoration: 'none',
          }}
        >
          Edit Team
        </Link>
      </div>
    </div>
  )
}
