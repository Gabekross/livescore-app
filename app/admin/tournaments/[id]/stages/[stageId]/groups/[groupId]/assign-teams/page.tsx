'use client'

import { useEffect, useState }  from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase }             from '@/lib/supabase'
import { useAdminOrg }          from '@/contexts/AdminOrgContext'
import toast                    from 'react-hot-toast'
import styles                   from '@/styles/components/Form.module.scss'
import Link                     from 'next/link'

interface Team {
  id:       string
  name:     string
  logo_url?: string
}

export default function AssignTeamsPage() {
  const { id, stageId, groupId } = useParams()
  const router  = useRouter()
  const { orgId, loading: orgLoading } = useAdminOrg()

  const [teams,           setTeams]           = useState<Team[]>([])
  const [assignedTeamIds, setAssignedTeamIds] = useState<string[]>([])
  const [assignedTeams,   setAssignedTeams]   = useState<Team[]>([])
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [loading,         setLoading]         = useState(false)

  useEffect(() => {
    if (!orgId) return

    // Only show teams from this org in the selector
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, logo_url')
        .eq('organization_id', orgId)
        .order('name')

      if (error) toast.error('Error fetching teams')
      else setTeams(data || [])
    }

    const fetchAssigned = async () => {
      // Teams already assigned to any group within this stage (prevent double-assignment)
      const { data: groupsInStage } = await supabase
        .from('groups')
        .select('id')
        .eq('stage_id', stageId)

      const groupIds = (groupsInStage || []).map((g) => g.id)

      if (!groupIds.length) return

      const { data: teamLinks } = await supabase
        .from('group_teams')
        .select('team_id, group_id, teams!inner(id, name, logo_url)')
        .in('group_id', groupIds)

      if (!teamLinks) return

      setAssignedTeamIds(teamLinks.map((row) => row.team_id))

      // Teams specifically assigned to THIS group (for display)
      const assignedToThisGroup = teamLinks.filter((link) => link.group_id === groupId)
      setAssignedTeams(
        assignedToThisGroup.map((link) =>
          Array.isArray(link.teams) ? link.teams[0] : link.teams
        ) as Team[]
      )
    }

    fetchTeams()
    fetchAssigned()
  }, [orgId, groupId, stageId])

  const handleToggle = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((tid) => tid !== teamId) : [...prev, teamId]
    )
  }

  const handleAssign = async () => {
    if (!groupId || selectedTeamIds.length === 0) {
      toast.error('Select at least one team')
      return
    }

    setLoading(true)
    const inserts = selectedTeamIds.map((team_id) => ({ group_id: groupId, team_id }))
    const { error } = await supabase.from('group_teams').insert(inserts)

    if (error) {
      toast.error('Failed to assign teams')
    } else {
      toast.success('Teams assigned successfully')
      router.push(`/admin/tournaments/${id}/stages`)
    }

    setLoading(false)
  }

  if (orgLoading) return <div style={{ padding: '2rem', color: '#6b7280' }}>Loading...</div>
  if (!orgId) return <div style={{ padding: '2rem', color: '#c0392b' }}>Failed to load organization context.</div>

  return (
    <div className={styles.formContainer}>
      <Link href={`/admin/tournaments/${id}/stages`} className={styles.backButton}>
        ← Back to Stages
      </Link>

      <h2 className={styles.heading}>
        Assign Teams to Group{' '}
        <span
          title="Each team can only belong to one group per stage."
          style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: '#888', cursor: 'help' }}
        >
          (i)
        </span>
      </h2>

      {assignedTeams.length > 0 && (
        <div className={styles.assignedBlock}>
          <h3>Already Assigned to This Group</h3>
          <ul className={styles.assignedList}>
            {assignedTeams.map((team) => (
              <li key={team.id} className={styles.assignedItem}>
                {team.logo_url && (
                  <img src={team.logo_url} alt={team.name} style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 6 }} />
                )}
                {team.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.form}>
        {teams.map((team) => {
          const alreadyAssigned = assignedTeamIds.includes(team.id)
          return (
            <div key={team.id} className={styles.teamCard} style={{ opacity: alreadyAssigned ? 0.5 : 1 }}>
              <label className={styles.label} style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  disabled={alreadyAssigned}
                  checked={selectedTeamIds.includes(team.id)}
                  onChange={() => handleToggle(team.id)}
                  className={styles.checkbox}
                />
                {team.logo_url && (
                  <img src={team.logo_url} alt={team.name} style={{ width: 30, height: 30, borderRadius: '50%', marginRight: 8 }} />
                )}
                {team.name}
                {alreadyAssigned && <span style={{ marginLeft: '0.5rem', color: '#888' }}>(already in a group)</span>}
              </label>
            </div>
          )
        })}

        <div className={styles.buttonRow}>
          <button onClick={handleAssign} disabled={loading} className={styles.button}>
            {loading ? 'Assigning…' : 'Assign Selected Teams'}
          </button>
        </div>
      </div>
    </div>
  )
}
