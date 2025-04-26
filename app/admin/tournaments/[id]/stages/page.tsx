'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'
import GroupStandings from '@/components/GroupStandings'
import styles from '@/styles/components/StageList.module.scss'

interface Stage {
  id: string
  stage_name: string
  order_number: number
  group_count?: number
}

interface Tournament {
  id: string
  name: string
}

interface Group {
  id: string
  name: string
  stage_id: string
}

interface Team {
  id: string
  name: string
  logo_url?: string
}

export default function TournamentStagesPage() {
  const { id } = useParams()
  const router = useRouter()
  const [stages, setStages] = useState<Stage[]>([])
  const [groups, setGroups] = useState<Record<string, Group[]>>({})
  const [groupTeamMap, setGroupTeamMap] = useState<Record<string, Team[]>>({})
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const toggleGroupVisibility = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const fetchTournament = async () => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching tournament:', error)
    } else {
      setTournament(data)
    }
  }

  const fetchStages = async () => {
    if (!id || typeof id !== 'string') {
      console.error('No valid tournament ID')
      return
    }

    const { data, error } = await supabase
      .from('tournament_stages')
      .select('*')
      .eq('tournament_id', id)
      .order('order_number', { ascending: true })

    if (error) {
      console.error('Supabase error loading stages:', error)
      toast.error('Error loading stages')
      return
    }

    const enrichedStages = await Promise.all(
      data.map(async (stage: any) => {
        const { count: groupCount } = await supabase
          .from('groups')
          .select('*', { count: 'exact', head: true })
          .eq('stage_id', stage.id)

        return {
          ...stage,
          group_count: groupCount ?? 0,
        }
      })
    )

    setStages(enrichedStages)
  }

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, stage_id')

    if (error) {
      console.error('Error fetching groups:', error)
      return
    }

    const grouped = data.reduce((acc: Record<string, Group[]>, group: Group) => {
      if (!acc[group.stage_id]) acc[group.stage_id] = []
      acc[group.stage_id].push(group)
      return acc
    }, {})

    setGroups(grouped)
  }

  const fetchGroupTeams = async () => {
    const { data, error } = await supabase
      .from('group_teams')
      .select('group_id, teams!inner(id, name, logo_url)')

    if (!error && data) {
      const grouped: Record<string, Team[]> = {}

      data.forEach(row => {
        const team = Array.isArray(row.teams) ? row.teams[0] : row.teams
        if (!grouped[row.group_id]) grouped[row.group_id] = []
        grouped[row.group_id].push(team)
      })

      setGroupTeamMap(grouped)
    }
  }

  useEffect(() => {
    fetchTournament()
    fetchStages()
    fetchGroups()
    fetchGroupTeams()
  }, [id])

  const handleDeleteStage = async (stageId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this stage?')
    if (!confirmDelete) return

    const { error } = await supabase.from('tournament_stages').delete().eq('id', stageId)
    if (error) {
      toast.error('Failed to delete stage')
    } else {
      toast.success('Stage deleted')
      fetchStages()
      fetchGroups()
    }
  }

  const handleDeleteTournament = async () => {
    const confirm = window.confirm('Are you sure you want to delete this tournament and all its data?')
    if (!confirm || !id) return

    const { error } = await supabase.from('tournaments').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete tournament')
    } else {
      toast.success('Tournament deleted')
      router.push('/admin/tournaments')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <Link href="/admin/tournaments" className={styles.backButton}>
          ← Back
        </Link>
        <h2 className={styles.heading}>{tournament?.name ?? 'Tournament'}</h2>
      </div>

      <div className={styles.topActions}>
        <Link href={`/admin/tournaments/${id}/stages/new`} className={styles.primaryButton}>
          ➕ Add New Stage
        </Link>
        <button onClick={handleDeleteTournament} className={styles.dangerButton}>
          🗑️ Delete Tournament
        </button>
      </div>

      <ul className={styles.stageList}>
        {stages.map((stage) => (
          <li key={stage.id} className={styles.stageItem}>
            <div className={styles.stageInfo}>
              <strong>{stage.stage_name}</strong>
              <div className={styles.meta}>
                <span>Order: {stage.order_number}</span>
                <span>Groups: {stage.group_count ?? 0}</span>
              </div>
            </div>
            <div className={styles.stageActions}>
              <Link href={`/admin/tournaments/${id}/stages/edit/${stage.id}`} className={styles.secondaryButton}>
                ✏️ Edit
              </Link>
              <Link href={`/admin/tournaments/${id}/stages/${stage.id}/groups/new`} className={styles.primaryButtonSmall}>
                ➕ Add Group
              </Link>
              <button onClick={() => handleDeleteStage(stage.id)} className={styles.dangerButtonSmall}>
                🗑️ Delete
              </button>
            </div>

            {groups[stage.id]?.length > 0 && (
              <ul className={styles.groupList}>
                {groups[stage.id].map((group) => (
                  <li key={group.id} className={styles.groupItem}>
                    <div className={styles.groupHeader}>
                      <span>• {group.name}</span>
                      <button
                        onClick={() => toggleGroupVisibility(group.id)}
                        className={styles.toggleButton}
                      >
                        {expandedGroups[group.id] ? '▾ Hide Teams' : '▸ Show Teams'}
                      </button>
                    </div>

                    {expandedGroups[group.id] && groupTeamMap[group.id] && (
                      <ul className={styles.teamList}>
                        {groupTeamMap[group.id].map((team) => (
                          <li key={team.id} className={styles.teamItem}>
                            {team.logo_url && (
                              <img
                                src={team.logo_url}
                                alt={team.name}
                                className={styles.teamLogo}
                              />
                            )}
                            {team.name}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className={styles.linkRow}>
                      <Link href={`/admin/tournaments/${id}/stages/${stage.id}/groups/${group.id}/assign-teams`}>
                        🎯 Assign Teams
                      </Link>
                      <Link href={`/admin/tournaments/${id}/stages/${stage.id}/groups/${group.id}/matches/new`}>
                        ⚽ Create Match
                      </Link>
                      <Link href={`/admin/tournaments/${id}/stages/${stage.id}/groups/${group.id}/matches`}>
                        📅 View Matches
                      </Link>
                      {/* Add this 👇 below the group name */}
                      {/* <GroupStandings groupId={group.id} /> */}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
