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
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.heading}>Teams</h1>
          <p className={styles.subheading}>Manage your organisation's teams, rosters, and logos.</p>
        </div>
        <Link href="/admin/teams/new" className={styles.newLink}>+ New Team</Link>
      </div>

      {teams.length === 0 ? (
        <div className={styles.emptyState}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>
            No teams yet
          </p>
          <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
            Create your first team to start building rosters and scheduling matches.
          </p>
        </div>
      ) : (
        <ul className={styles.teamList}>
          {teams.map((team) => (
            <li key={team.id} className={styles.teamItem}>
              {team.logo_url ? (
                <img src={team.logo_url} alt={team.name} className={styles.logo} />
              ) : (
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: '#f3f4f6',
                  border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
                }}>
                  &#9917;
                </div>
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
      )}
    </div>
  )
}
