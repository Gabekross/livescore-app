'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import styles from '@/styles/components/TeamList.module.scss'
import toast from 'react-hot-toast'

type Team = {
  id: string
  name: string
  logo_url: string | null
}

export default function AdminTeamListPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTeams = async () => {
    const { data, error } = await supabase.from('teams').select('*').order('name')
    if (error) {
      toast.error('Error loading teams')
    } else {
      setTeams(data)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this team?')
    if (!confirm) return

    setLoading(true)
    const { error } = await supabase.from('teams').delete().eq('id', id)

    if (error) {
      toast.error('Failed to delete team')
    } else {
      toast.success('Team deleted!')
      fetchTeams() // refresh list
    }

    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>All Teams</h2>
      <Link href="/admin/teams/new" className={styles.newLink}>+ Add New Team</Link>

      <ul className={styles.teamList}>
        {teams.map((team) => (
          <li key={team.id} className={styles.teamItem}>
            {team.logo_url && (
              <img src={team.logo_url} alt={team.name} className={styles.logo} />
            )}
            <span className={styles.teamName}>{team.name}</span>
            <div className={styles.actions}>
              <Link href={`/admin/teams/view/${team.id}`} className={styles.viewButton}>View</Link>
              <Link href={`/admin/teams/edit/${team.id}`} className={styles.editButton}>Edit</Link>
              <button
                onClick={() => handleDelete(team.id)}
                disabled={loading}
                className={styles.deleteButton}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>   
    </div>
  )
}
