'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/PublicStageDetail.module.scss'
import GroupStandings from '@/components/GroupStandings'
import TournamentStandings from '@/components/TournamentStandings'

interface Group {
  id: string
  name: string
  stage_id: string
}

interface Match {
  id: string
  match_date: string
  venue?: string
  status: string
  home_score: number | null
  away_score: number | null
  group_id: string
  home_team: { id: string; name: string; logo_url?: string }
  away_team: { id: string; name: string; logo_url?: string }
}

export default function PublicStageDetailPage() {
  const { id, stageId } = useParams()
  const router = useRouter()

  const [groups, setGroups] = useState<Group[]>([])
  const [matchesByGroup, setMatchesByGroup] = useState<Record<string, Match[]>>({})
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [showToday, setShowToday] = useState(true)
  const [showUpcoming, setShowUpcoming] = useState(true)
  const [allStages, setAllStages] = useState<{ id: string; stage_name: string }[]>([])
  const [selectedStageName, setSelectedStageName] = useState('')

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data: stageData } = await supabase
        .from('tournament_stages')
        .select('id, stage_name')
        .eq('tournament_id', id)

      if (stageData) {
        setAllStages(stageData)
        const selectedStage = stageData.find(stage => stage.id === stageId)
        setSelectedStageName(selectedStage?.stage_name || '')
      }

      const { data: groupData } = await supabase
        .from('groups')
        .select('id, name, stage_id')
        .eq('stage_id', stageId)
      setGroups(groupData || [])

      const { data: matchData } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          venue,
          status,
          group_id,
          home_score,
          away_score,
          home_team:home_team_id(id, name, logo_url),
          away_team:away_team_id(id, name, logo_url)
        `)

      if (matchData) {
        const grouped: Record<string, Match[]> = {}
        matchData.forEach(match => {
          const groupId = match.group_id
          const home = Array.isArray(match.home_team) ? match.home_team[0] : match.home_team
          const away = Array.isArray(match.away_team) ? match.away_team[0] : match.away_team
          const cleanMatch = { ...match, home_team: home, away_team: away }
          if (!grouped[groupId]) grouped[groupId] = []
          grouped[groupId].push(cleanMatch)
        })
        setMatchesByGroup(grouped)
      }
    }

    fetchData()

    const subscription = supabase
      .channel('public:matches')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [id, stageId])

  const today = new Date().toISOString().split('T')[0]

  const todaysMatches = Object.values(matchesByGroup)
    .flat()
    .filter((match) => match.match_date.startsWith(today))

  const upcomingMatches = Object.values(matchesByGroup)
    .flat()
    .filter((match) => {
      const matchDate = new Date(match.match_date)
      return matchDate > new Date() && match.status === 'scheduled'
    })

  const MatchCard = ({ match }: { match: Match }) => (
    <div className={styles.card}>
      <div className={styles.matchMeta}>
        <span className={`${styles.status} ${match.status === 'ongoing' ? styles.live : ''}`}>
          {match.status === 'finished'
            ? 'FT'
            : match.status === 'ongoing'
            ? 'LIVE'
            : match.status === 'halftime'
            ? 'HALFTIME'
            : new Date(match.match_date).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }).replace(',', '')}
        </span>
        <span className={styles.venue}>{match.venue || 'TBD'}</span>
      </div>

      <div className={styles.teamsDesktop}>
        <div className={styles.teamLeft}>
          {match.home_team.logo_url && <img src={match.home_team.logo_url} alt="home logo" className={styles.logo} />}
          <span>{match.home_team.name}</span>
        </div>
        <div className={styles.score}>
          {match.home_score ?? '-'} – {match.away_score ?? '-'}
        </div>
        <div className={styles.teamRight}>
          <span>{match.away_team.name}</span>
          {match.away_team.logo_url && <img src={match.away_team.logo_url} alt="away logo" className={styles.logo} />}
        </div>
      </div>

      <div className={styles.teamsMobile}>
        <div className={styles.row}>
          {match.home_team.logo_url && <img src={match.home_team.logo_url} alt="home logo" className={styles.logo} />}
          <span className={styles.name}>{match.home_team.name}</span>
          <span className={styles.mobileScore}>{match.home_score ?? '-'}</span>
        </div>
        <div className={styles.row}>
          {match.away_team.logo_url && <img src={match.away_team.logo_url} alt="away logo" className={styles.logo} />}
          <span className={styles.name}>{match.away_team.name}</span>
          <span className={styles.mobileScore}>{match.away_score ?? '-'}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Matches & Standings</h1>

      <div className={styles.stageSelector}>
        <label htmlFor="stage-select" className={styles.groupName}>Select Stage : </label>
        <select
          id="stage-select"
          value={stageId}
          onChange={(e) => {
            const newStageId = e.target.value
            router.push(`/public/tournaments/${id}/stages/${newStageId}`)
          }}
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
          {showUpcoming && <div className={styles.matchList}>{upcomingMatches.map(m => <MatchCard key={m.id} match={m} />)}</div>}
        </div>
      )}

      {todaysMatches.length > 0 && (
        <div className={styles.block}>
          <h2 className={styles.groupName} onClick={() => setShowToday((prev) => !prev)}>
            🗓️ Today’s Matches {showToday ? '▾' : '▸'}
          </h2>
          {showToday && <div className={styles.matchList}>{todaysMatches.map(m => <MatchCard key={m.id} match={m} />)}</div>}
        </div>
      )}

      {groups.map(group => (
        <div key={group.id} className={styles.groupBlock}>
          <h2 className={styles.groupName} onClick={() => toggleGroup(group.id)}>
            {group.name} {expandedGroups[group.id] ? '▾' : '▸'}
          </h2>

          {expandedGroups[group.id] && (
            <>
              <div className={styles.matchList}>
                {matchesByGroup[group.id]?.map(m => <MatchCard key={m.id} match={m} />)}
              </div>

              {selectedStageName === 'Preliminary' && <GroupStandings groupId={group.id} />}
            </>
          )}
        </div>
      ))}

      <TournamentStandings tournamentId={id as string} selectedStageName={selectedStageName} />
    </div>
  )
}
