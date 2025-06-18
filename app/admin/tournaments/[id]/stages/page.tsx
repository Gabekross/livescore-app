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
  start_date?: string
  end_date?: string
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
  const [editingStageId, setEditingStageId] = useState<string | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [stageNameDraft, setStageNameDraft] = useState('')
  const [groupNameDraft, setGroupNameDraft] = useState('')

  const toggleGroupVisibility = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const fetchTournament = async () => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name, start_date, end_date')
      .eq('id', id)
      .single()

    if (!error && data) setTournament(data)
  }

  const fetchStages = async () => {
    const { data, error } = await supabase
      .from('tournament_stages')
      .select('*')
      .eq('tournament_id', id)
      .order('order_number')

    if (!error && data) {
      const enrichedStages = await Promise.all(
        data.map(async (stage) => {
          const { count } = await supabase
            .from('groups')
            .select('*', { count: 'exact', head: true })
            .eq('stage_id', stage.id)
          return { ...stage, group_count: count ?? 0 }
        })
      )
      setStages(enrichedStages)
    }
  }

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, stage_id')

    if (!error && data) {
      const grouped = data.reduce((acc: Record<string, Group[]>, group: Group) => {
        if (!acc[group.stage_id]) acc[group.stage_id] = []
        acc[group.stage_id].push(group)
        return acc
      }, {})
      setGroups(grouped)
    }
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

  const handleSaveStageName = async (stageId: string) => {
    const { error } = await supabase
      .from('tournament_stages')
      .update({ stage_name: stageNameDraft })
      .eq('id', stageId)

    if (!error) {
      toast.success('Stage name updated')
      setEditingStageId(null)
      fetchStages()
    } else {
      toast.error('Failed to update stage name')
    }
  }

  const handleSaveGroupName = async (groupId: string) => {
    const { error } = await supabase
      .from('groups')
      .update({ name: groupNameDraft })
      .eq('id', groupId)

    if (!error) {
      toast.success('Group name updated')
      setEditingGroupId(null)
      fetchGroups()
    } else {
      toast.error('Failed to update group name')
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
              {editingStageId === stage.id ? (
                <>
                  <input
                    className={styles.stageNameInput}
                    value={stageNameDraft}
                    onChange={(e) => setStageNameDraft(e.target.value)}
                  />
                  <button onClick={() => handleSaveStageName(stage.id)}>💾 Save</button>
                  <button onClick={() => setEditingStageId(null)}>❌ Cancel</button>
                </>
              ) : (
                <>
                  <strong>{stage.stage_name}</strong>
                  <button onClick={() => {
                    setStageNameDraft(stage.stage_name)
                    setEditingStageId(stage.id)
                  }}>✏️ Edit</button>
                </>
              )}
            </div>
            <div className={styles.meta}>
              <span>Order: {stage.order_number}</span>
              <span>Groups: {stage.group_count ?? 0}</span>
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
                      {editingGroupId === group.id ? (
                        <>
                          <input
                            className={styles.groupNameInput}
                            value={groupNameDraft}
                            onChange={(e) => setGroupNameDraft(e.target.value)}
                          />
                          <button onClick={() => handleSaveGroupName(group.id)}>💾 Save</button>
                          <button onClick={() => setEditingGroupId(null)}>❌ Cancel</button>
                        </>
                      ) : (
                        <>
                          <span>• {group.name}</span>
                          <button onClick={() => {
                            setGroupNameDraft(group.name)
                            setEditingGroupId(group.id)
                          }}>✏️ Edit</button>
                        </>
                      )}
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
