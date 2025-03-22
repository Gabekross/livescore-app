'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/TeamView.module.scss'
import toast from 'react-hot-toast'

export default function TeamDetailsPage() {
  const { id } = useParams()
  const [team, setTeam] = useState<any>(null)

  useEffect(() => {
    const fetchTeam = async () => {
      if (!id || typeof id !== 'string') return

      const { data, error } = await supabase.from('teams').select('*').eq('id', id).single()
      if (error) {
        toast.error('Team not found')
      } else {
        setTeam(data)
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
    </div>
  )
}
