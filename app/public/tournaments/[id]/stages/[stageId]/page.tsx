'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/PublicStageDetail.module.scss'
import GroupStandings from '@/components/GroupStandings'

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
  home_team: { id: string; name: string }
  away_team: { id: string; name: string }
}

export default function PublicStageDetailPage() {
  const { id, stageId } = useParams()
  const [groups, setGroups] = useState<Group[]>([])
  const [matchesByGroup, setMatchesByGroup] = useState<Record<string, Match[]>>({})
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [showToday, setShowToday] = useState<boolean>(true)
  const [showUpcoming, setShowUpcoming] = useState<boolean>(true)

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  useEffect(() => {
    const fetchGroups = async () => {
      const { data } = await supabase
        .from('groups')
        .select('id, name, stage_id')
        .eq('stage_id', stageId)
      setGroups(data || [])
    }

    const fetchMatches = async () => {
      const { data } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          venue,
          status,
          group_id,
          home_score,
          away_score,
          home_team:home_team_id(id, name),
          away_team:away_team_id(id, name)
        `)

      if (data) {
        const grouped: Record<string, Match[]> = {}
        data.forEach((match) => {
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

    fetchGroups()
    fetchMatches()
  }, [stageId])

  const today = new Date().toISOString().split('T')[0]

  const todaysMatches = Object.values(matchesByGroup)
    .flat()
    .filter((match) => match.match_date.startsWith(today))

  const upcomingMatches = Object.values(matchesByGroup)
    .flat()
    .filter((match) => {
      const matchDate = new Date(match.match_date)
      const now = new Date()
      return matchDate > now && match.status === 'scheduled'
    })

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Matches & Standings</h1>

      {/* Today’s Matches */}
      {todaysMatches.length > 0 && (
        <div className={styles.todaysMatches}>
          <h2 className={styles.groupName} onClick={() => setShowToday((prev) => !prev)}>
            🗓️ Today’s Matches {showToday ? '▾' : '▸'}
          </h2>

          {showToday && (
            <div className={styles.matches}>
              {todaysMatches.map((match) => (
                <div key={match.id} className={styles.matchRow}>
                  <span className={`${styles.status} ${match.status === 'ongoing' ? styles.live : ''}`}>
                    {match.status === 'finished'
                      ? 'FT'
                      : match.status === 'ongoing'
                      ? 'LIVE'
                      : new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={styles.team}>{match.home_team.name}</span>
                  <span className={styles.score}>
                    {match.home_score ?? '-'} – {match.away_score ?? '-'}
                  </span>
                  <span className={styles.team}>{match.away_team.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div className={styles.upcomingMatches}>
          <h2 className={styles.groupName} onClick={() => setShowUpcoming((prev) => !prev)}>
            📅 Upcoming Matches {showUpcoming ? '▾' : '▸'}
          </h2>

          {showUpcoming && (
            <div className={styles.matches}>
              {upcomingMatches.map((match) => (
                <div key={match.id} className={styles.matchRow}>
                  <span className={styles.status}>
                    {new Date(match.match_date).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className={styles.team}>{match.home_team.name}</span>
                  <span className={styles.score}>
                    {match.home_score ?? '-'} – {match.away_score ?? '-'}
                  </span>
                  <span className={styles.team}>{match.away_team.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Group Section */}
      {groups.map((group) => (
        <div key={group.id} className={styles.groupBlock}>
          <h2 className={styles.groupName} onClick={() => toggleGroup(group.id)}>
            {group.name} {expandedGroups[group.id] ? '▾' : '▸'}
          </h2>

          {expandedGroups[group.id] && (
            <>
              <div className={styles.matches}>
                {matchesByGroup[group.id]?.length > 0 ? (
                  matchesByGroup[group.id].map((match) => (
                    <div key={match.id} className={styles.matchRow}>
                      <span className={`${styles.status} ${match.status === 'ongoing' ? styles.live : ''}`}>
                        {match.status === 'finished'
                          ? 'FT'
                          : match.status === 'ongoing'
                          ? 'LIVE'
                          : new Date(match.match_date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            }).replace(',', '')}
                      </span>
                      <span className={styles.team}>{match.home_team.name}</span>
                      <span className={styles.score}>
                        {match.home_score ?? '-'} – {match.away_score ?? '-'}
                      </span>
                      <span className={styles.team}>{match.away_team.name}</span>
                    </div>
                  ))
                ) : (
                  <p className={styles.noMatch}>No matches in this group yet.</p>
                )}
              </div>

              <GroupStandings groupId={group.id} />
            </>
          )}
        </div>
      ))}
    </div>
  )
}
