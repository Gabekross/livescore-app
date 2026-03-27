'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase }             from '@/lib/supabase'
import { getOrganizationId }    from '@/lib/org'
import styles                   from '@/styles/components/PublicStageDetail.module.scss'
import GroupStandings           from '@/components/GroupStandings'
import TournamentStandings      from '@/components/TournamentStandings'

interface Group {
  id:       string
  name:     string
  stage_id: string
}

interface Match {
  id:         string
  match_date: string
  venue?:     string
  status:     string   // scheduled | live | halftime | completed
  home_score: number | null
  away_score: number | null
  group_id:   string
  home_team:  { id: string; name: string; logo_url?: string }
  away_team:  { id: string; name: string; logo_url?: string }
}

function matchStatusLabel(match: Match): string {
  switch (match.status) {
    case 'completed': return 'FT'
    case 'live':      return 'LIVE'
    case 'halftime':  return 'HT'
    default:
      return new Date(match.match_date).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
      }).replace(',', '')
  }
}

export default function PublicStageDetailPage() {
  const { id, stageId } = useParams()
  const router = useRouter()

  const [groups,          setGroups]          = useState<Group[]>([])
  const [matchesByGroup,  setMatchesByGroup]  = useState<Record<string, Match[]>>({})
  const [expandedGroups,  setExpandedGroups]  = useState<Record<string, boolean>>({})
  const [showToday,       setShowToday]       = useState(true)
  const [showUpcoming,    setShowUpcoming]    = useState(true)
  const [allStages,       setAllStages]       = useState<{ id: string; stage_name: string }[]>([])
  // show_standings comes from tournament_stages.show_standings — replaces the old
  // hardcoded 'selectedStageName === Preliminary' and 'selectedStageName === Group Stage' checks
  const [showStandings,   setShowStandings]   = useState(false)
  const [showGroupStandings, setShowGroupStandings] = useState(false)

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  useEffect(() => {
    const fetchData = async () => {
      const orgId = await getOrganizationId()

      // Fetch all stages for the stage selector dropdown
      const { data: stageData } = await supabase
        .from('tournament_stages')
        .select('id, stage_name, show_standings')
        .eq('tournament_id', id)

      if (stageData) {
        setAllStages(stageData)
        const currentStage = stageData.find((s) => s.id === stageId)
        setShowStandings(currentStage?.show_standings ?? false)
        // Show per-group standings when show_standings is true and there are groups
        setShowGroupStandings(currentStage?.show_standings ?? false)
      }

      const { data: groupData } = await supabase
        .from('groups')
        .select('id, name, stage_id')
        .eq('stage_id', stageId)
      setGroups(groupData || [])

      const { data: matchData } = await supabase
        .from('matches')
        .select(`
          id, match_date, venue, status, group_id, home_score, away_score,
          home_team:home_team_id(id, name, logo_url),
          away_team:away_team_id(id, name, logo_url)
        `)
        .eq('organization_id', orgId)
        .in('group_id', (groupData || []).map((g) => g.id))

      if (matchData) {
        const grouped: Record<string, Match[]> = {}
        matchData.forEach((match) => {
          const gId  = match.group_id
          const home = Array.isArray(match.home_team) ? match.home_team[0] : match.home_team
          const away = Array.isArray(match.away_team) ? match.away_team[0] : match.away_team
          if (!grouped[gId]) grouped[gId] = []
          grouped[gId].push({ ...match, home_team: home, away_team: away })
        })
        setMatchesByGroup(grouped)
      }
    }

    fetchData()

    const subscription = supabase
      .channel('public:matches')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' },
        () => fetchData()
      )
      .subscribe()

    return () => { supabase.removeChannel(subscription) }
  }, [id, stageId])

  const today = new Date().toISOString().split('T')[0]

  const todaysMatches = Object.values(matchesByGroup).flat()
    .filter((m) => m.match_date.startsWith(today))

  const upcomingMatches = Object.values(matchesByGroup).flat()
    .filter((m) => new Date(m.match_date) > new Date() && m.status === 'scheduled')

  const MatchCard = ({ match }: { match: Match }) => (
    <div className={styles.card}>
      <div className={styles.matchMeta}>
        <span className={`${styles.status} ${match.status === 'live' ? styles.live : ''}`}>
          {matchStatusLabel(match)}
        </span>
        <span className={styles.venue}>{match.venue || 'TBD'}</span>
      </div>

      <div className={styles.teamsDesktop}>
        <div className={styles.teamLeft}>
          {match.home_team.logo_url && (
            <img src={match.home_team.logo_url} alt="home logo" className={styles.logo} />
          )}
          <span>{match.home_team.name}</span>
        </div>
        <div className={styles.score}>{match.home_score ?? '-'} – {match.away_score ?? '-'}</div>
        <div className={styles.teamRight}>
          <span>{match.away_team.name}</span>
          {match.away_team.logo_url && (
            <img src={match.away_team.logo_url} alt="away logo" className={styles.logo} />
          )}
        </div>
      </div>

      <div className={styles.teamsMobile}>
        <div className={styles.row}>
          {match.home_team.logo_url && (
            <img src={match.home_team.logo_url} alt="home logo" className={styles.logo} />
          )}
          <span className={styles.name}>{match.home_team.name}</span>
          <span className={styles.mobileScore}>{match.home_score ?? '-'}</span>
        </div>
        <div className={styles.row}>
          {match.away_team.logo_url && (
            <img src={match.away_team.logo_url} alt="away logo" className={styles.logo} />
          )}
          <span className={styles.name}>{match.away_team.name}</span>
          <span className={styles.mobileScore}>{match.away_score ?? '-'}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Matches &amp; Standings</h1>

      <div className={styles.stageSelector}>
        <label htmlFor="stage-select" className={styles.groupName}>Select Stage: </label>
        <select
          id="stage-select"
          value={stageId as string}
          onChange={(e) =>
            router.push(`/public/tournaments/${id}/stages/${e.target.value}`)
          }
        >
          {allStages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.stage_name}
            </option>
          ))}
        </select>
      </div>

      {upcomingMatches.length > 0 && (
        <div className={styles.block}>
          <h2 className={styles.groupName} onClick={() => setShowUpcoming((prev) => !prev)}>
            📅 Upcoming Matches {showUpcoming ? '▾' : '▸'}
          </h2>
          {showUpcoming && (
            <div className={styles.matchList}>
              {upcomingMatches.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          )}
        </div>
      )}

      {todaysMatches.length > 0 && (
        <div className={styles.block}>
          <h2 className={styles.groupName} onClick={() => setShowToday((prev) => !prev)}>
            🗓️ Today&apos;s Matches {showToday ? '▾' : '▸'}
          </h2>
          {showToday && (
            <div className={styles.matchList}>
              {todaysMatches.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          )}
        </div>
      )}

      {groups.map((group) => (
        <div key={group.id} className={styles.groupBlock}>
          <h2 className={styles.groupName} onClick={() => toggleGroup(group.id)}>
            {group.name} {expandedGroups[group.id] ? '▾' : '▸'}
          </h2>

          {expandedGroups[group.id] && (
            <>
              <div className={styles.matchList}>
                {matchesByGroup[group.id]?.map((m) => <MatchCard key={m.id} match={m} />)}
              </div>
              {showGroupStandings && <GroupStandings groupId={group.id} />}
            </>
          )}
        </div>
      ))}

      {showStandings && (
        <TournamentStandings
          tournamentId={id as string}
          showStandings={showStandings}
        />
      )}
    </div>
  )
}
