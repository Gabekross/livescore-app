'use client'

import { useEffect, useState, useCallback } from 'react'
import Link                    from 'next/link'
import { supabase }            from '@/lib/supabase'
import { useAdminOrg }         from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }     from '@/components/admin/AdminOrgGate'
import toast                   from 'react-hot-toast'
import styles                  from '@/styles/components/TeamList.module.scss'

type Team = {
  id:       string
  name:     string
  logo_url: string | null
}

export default function AdminTeamListPage() {
  const { orgId, loading: orgLoading } = useAdminOrg()
  const orgGate = useAdminOrgGate()

  const [teams,   setTeams]   = useState<Team[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTeams = useCallback(async () => {
    if (!orgId) return
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, logo_url')
      .eq('organization_id', orgId)
      .order('name')

    if (error) {
      toast.error('Error loading teams')
    } else {
      setTeams(data)
    }
  }, [orgId])

  useEffect(() => { fetchTeams() }, [fetchTeams])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return
    setLoading(true)

    const { error } = await supabase.from('teams').delete().eq('id', id)

    if (error) {
      toast.error('Failed to delete team')
    } else {
      toast.success('Team deleted')
      fetchTeams()
    }
    setLoading(false)
  }

  if (orgGate) return orgGate

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
              <Link href={`/admin/teams/view/${team.id}`}  className={styles.viewButton}>View</Link>
              <Link href={`/admin/teams/edit/${team.id}`}  className={styles.editButton}>Edit</Link>
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
