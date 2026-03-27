'use client'

// app/table/StandingsView.tsx
// Client component: handles tournament/stage picker state + fetches group standings.

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams }        from 'next/navigation'
import { supabase }                          from '@/lib/supabase'
import SectionHeader                         from '@/components/ui/SectionHeader'
import EmptyState                            from '@/components/ui/EmptyState'
import TeamLogo                              from '@/components/ui/TeamLogo'
import styles                               from '@/styles/components/TablePage.module.scss'

interface Tournament { id: string; name: string; slug: string }
interface Stage      { id: string; stage_name: string; tournament_id: string; show_standings: boolean }

interface Group      { id: string; group_name: string }

interface StandingRow {
  team_id:         string
  team_name:       string
  logo_url?:       string | null
  played:          number
  won:             number
  drawn:           number
  lost:            number
  goals_for:       number
  goals_against:   number
  goal_difference: number
  points:          number
}

interface Props {
  orgId:                  string
  tournaments:            Tournament[]
  stages:                 Stage[]
  selectedTournamentId:   string
  selectedStageId:        string
}

export default function StandingsView({
  orgId,
  tournaments,
  stages,
  selectedTournamentId: initialTournId,
  selectedStageId:      initialStageId,
}: Props) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [tournId, setTournId]   = useState(initialTournId)
  const [stageId, setStageId]   = useState(initialStageId)
  const [groups,  setGroups]    = useState<Group[]>([])
  const [standings, setStandings] = useState<Record<string, StandingRow[]>>({})
  const [loading,   setLoading]   = useState(false)

  const stagesForTourn = stages.filter((s) => s.tournament_id === tournId)

  // ── Fetch groups for selected stage ───────────────────────────────────
  const fetchGroups = useCallback(async (sid: string) => {
    if (!sid) return
    setLoading(true)

    const { data: groupData } = await supabase
      .from('groups')
      .select('id, group_name')
      .eq('stage_id', sid)
      .order('group_name')

    const g = (groupData || []) as Group[]
    setGroups(g)

    // Fetch standings per group via RPC
    const results = await Promise.all(
      g.map((group) =>
        supabase.rpc('get_group_standings', { p_group_id: group.id })
      )
    )

    const map: Record<string, StandingRow[]> = {}
    g.forEach((group, i) => {
      map[group.id] = (results[i].data || []) as StandingRow[]
    })
    setStandings(map)
    setLoading(false)
  }, [])

  useEffect(() => { fetchGroups(stageId) }, [stageId, fetchGroups])

  const handleTournChange = (tid: string) => {
    setTournId(tid)
    const firstStage = stages.find((s) => s.tournament_id === tid)
    const sid = firstStage?.id || ''
    setStageId(sid)
    router.push(`/table?tournament=${tid}&stage=${sid}`, { scroll: false })
  }

  const handleStageChange = (sid: string) => {
    setStageId(sid)
    router.push(`/table?tournament=${tournId}&stage=${sid}`, { scroll: false })
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <SectionHeader title="Table" subtitle="Tournament standings" />

        {/* Pickers */}
        <div className={styles.pickers}>
          <select
            className={styles.pickerSelect}
            value={tournId}
            onChange={(e) => handleTournChange(e.target.value)}
            aria-label="Select tournament"
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {stagesForTourn.length > 1 && (
            <select
              className={styles.pickerSelect}
              value={stageId}
              onChange={(e) => handleStageChange(e.target.value)}
              aria-label="Select stage"
            >
              {stagesForTourn.map((s) => (
                <option key={s.id} value={s.id}>{s.stage_name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Standings */}
        {loading ? (
          <EmptyState icon="" title="Loading standings…" />
        ) : groups.length === 0 ? (
          <EmptyState
            icon=""
            title="No groups found"
            description="This stage has no groups, or standings aren't enabled."
          />
        ) : (
          groups.map((group) => (
            <GroupTable
              key={group.id}
              groupName={group.group_name}
              rows={standings[group.id] || []}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Group table ───────────────────────────────────────────────────────────────
function GroupTable({ groupName, rows }: { groupName: string; rows: StandingRow[] }) {
  return (
    <div className={styles.groupSection}>
      <div className={styles.groupHeading}>{groupName}</div>

      {rows.length === 0 ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
          No matches played yet
        </div>
      ) : (
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.thPos}>#</th>
              <th className={styles.thTeam}>Team</th>
              <th className={styles.thStat}>MP</th>
              <th className={styles.thStat}>W</th>
              <th className={`${styles.thStat} ${styles.hideOnMobile}`}>D</th>
              <th className={`${styles.thStat} ${styles.hideOnMobile}`}>L</th>
              <th className={`${styles.thStat} ${styles.hideOnMobile}`}>GF</th>
              <th className={`${styles.thStat} ${styles.hideOnMobile}`}>GA</th>
              <th className={styles.thStat}>GD</th>
              <th className={styles.thStat}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.team_id}
                className={`${styles.tr} ${i < 2 ? styles.trTop : ''}`}
              >
                <td className={styles.tdPos}>{i + 1}</td>
                <td>
                  <div className={styles.tdTeam}>
                    <TeamLogo src={row.logo_url} alt={row.team_name} size={20} />
                    <span className={styles.teamName}>{row.team_name}</span>
                  </div>
                </td>
                <td className={styles.tdStat}>{row.played}</td>
                <td className={styles.tdStat}>{row.won}</td>
                <td className={`${styles.tdStat} ${styles.hideOnMobile}`}>{row.drawn}</td>
                <td className={`${styles.tdStat} ${styles.hideOnMobile}`}>{row.lost}</td>
                <td className={`${styles.tdStat} ${styles.hideOnMobile}`}>{row.goals_for}</td>
                <td className={`${styles.tdStat} ${styles.hideOnMobile}`}>{row.goals_against}</td>
                <td className={styles.tdStat}>{row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}</td>
                <td className={styles.tdPts}>{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
