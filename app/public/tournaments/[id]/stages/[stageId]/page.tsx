// 'use client'

// import { useEffect, useState } from 'react'
// import { useParams } from 'next/navigation'
// import Link from 'next/link'
// import { supabase } from '@/lib/supabase'
// import styles from '@/styles/components/PublicStageDetail.module.scss'
// import GroupStandings from '@/components/GroupStandings'
// import TournamentStandings from '@/components/TournamentStandings'

// interface Group {
//   id: string
//   name: string
//   stage_id: string
// }

// interface Match {
//   id: string
//   match_date: string
//   venue?: string
//   status: string
//   home_score: number | null
//   away_score: number | null
//   group_id: string
//   home_team: { id: string; name: string }
//   away_team: { id: string; name: string }
// }

// export default function PublicStageDetailPage() {
//   const { id, stageId } = useParams()
//   const [groups, setGroups] = useState<Group[]>([])
//   const [matchesByGroup, setMatchesByGroup] = useState<Record<string, Match[]>>({})
//   const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({tournament: true})
//   const [showToday, setShowToday] = useState(true)
//   const [showUpcoming, setShowUpcoming] = useState(true)

//   const today = new Date().toISOString().split('T')[0]

//   const toggleGroup = (groupId: string) => {
//     setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
//   }

//   useEffect(() => {
//     const fetchGroups = async () => {
//       const { data } = await supabase
//         .from('groups')
//         .select('id, name, stage_id')
//         .eq('stage_id', stageId)
//       setGroups(data || [])
//     }

//     const fetchMatches = async () => {
//       const { data } = await supabase
//         .from('matches')
//         .select(`
//           id,
//           match_date,
//           venue,
//           status,
//           group_id,
//           home_score,
//           away_score,
//           home_team:home_team_id(id, name),
//           away_team:away_team_id(id, name)
//         `)

//       if (data) {
//         const grouped: Record<string, Match[]> = {}
//         data.forEach((match) => {
//           const groupId = match.group_id
//           const home = Array.isArray(match.home_team) ? match.home_team[0] : match.home_team
//           const away = Array.isArray(match.away_team) ? match.away_team[0] : match.away_team
//           const cleanMatch = { ...match, home_team: home, away_team: away }
//           if (!grouped[groupId]) grouped[groupId] = []
//           grouped[groupId].push(cleanMatch)
//         })
//         setMatchesByGroup(grouped)
//       }
//     }

//     fetchGroups()
//     fetchMatches()
//   }, [stageId])

//   const todaysMatches = Object.values(matchesByGroup)
//     .flat()
//     .filter((match) => match.match_date.startsWith(today))

//   const upcomingMatches = Object.values(matchesByGroup)
//     .flat()
//     .filter((match) => {
//       const matchDate = new Date(match.match_date)
//       const now = new Date()
//       return matchDate > now && match.status === 'scheduled'
//     })

//   return (
//     <div className={styles.container}>
//       <div className={styles.header}>
//         <h1>🏟️ Tournament Matches & Standings</h1>
//         <Link href="/public/matches" className={styles.backLink}>
//           ← Back to Tournament List
//         </Link>
//       </div>

//       {upcomingMatches.length > 0 && (
//         <div className={styles.block}>
//           <h2 onClick={() => setShowUpcoming(!showUpcoming)}>
//             📅 Upcoming Matches {showUpcoming ? '▾' : '▸'}
//           </h2>
//           {showUpcoming && (
//             <div className={styles.matchList}>
//               {upcomingMatches.map(match => (
//                 <div key={match.id} className={styles.matchRow}>
//                   <span className={styles.status}>
//                     {new Date(match.match_date).toLocaleString('en-GB', {
//                       day: '2-digit',
//                       month: 'short',
//                       hour: '2-digit',
//                       minute: '2-digit'
//                     })}
//                   </span>
//                   <span className={styles.team}>{match.home_team.name}</span>
//                   <span className={styles.score}>{match.home_score ?? '-'} – {match.away_score ?? '-'}</span>
//                   <span className={styles.team}>{match.away_team.name}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}

//       {todaysMatches.length > 0 && (
//         <div className={styles.block}>
//           <h2 onClick={() => setShowToday(!showToday)}>
//             🗓️ Today’s Matches {showToday ? '▾' : '▸'}
//           </h2>
//           {showToday && (
//             <div className={styles.matchList}>
//               {todaysMatches.map(match => (
//                 <div key={match.id} className={styles.matchRow}>
//                   <span className={`${styles.status} ${match.status === 'ongoing' ? styles.live : ''}`}>
//                     {match.status === 'finished'
//                       ? 'FT'
//                       : match.status === 'ongoing'
//                       ? 'LIVE'
//                       : new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                   </span>
//                   <span className={styles.team}>{match.home_team.name}</span>
//                   <span className={styles.score}>{match.home_score ?? '-'} – {match.away_score ?? '-'}</span>
//                   <span className={styles.team}>{match.away_team.name}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}

//       {groups.map((group) => (
//         <div key={group.id} className={styles.block}>
//           <h2 className={styles.groupHeader} onClick={() => toggleGroup(group.id)}>
//             {group.name} {expandedGroups[group.id] ? '▾' : '▸'}
//           </h2>

//           {expandedGroups[group.id] && (
//             <>
//               <div className={styles.matchList}>
//                 {matchesByGroup[group.id]?.length > 0 ? (
//                   matchesByGroup[group.id].map((match) => (
//                     <div key={match.id} className={styles.matchRow}>
//                       <span className={`${styles.status} ${match.status === 'ongoing' ? styles.live : ''}`}>
//                         {match.status === 'finished'
//                           ? 'FT'
//                           : match.status === 'ongoing'
//                           ? 'LIVE'
//                           : new Date(match.match_date).toLocaleDateString('en-GB', {
//                               day: '2-digit',
//                               month: 'short',
//                               hour: '2-digit',
//                               minute: '2-digit',
//                               hour12: false,
//                             })}
//                       </span>
//                       <span className={styles.team}>{match.home_team.name}</span>
//                       <span className={styles.score}>
//                         {match.home_score ?? '-'} – {match.away_score ?? '-'}
//                       </span>
//                       <span className={styles.team}>{match.away_team.name}</span>
//                     </div>
//                   ))
//                 ) : (
//                   <p className={styles.noMatch}>No matches in this group yet.</p>
//                 )}
//               </div>

//               <GroupStandings groupId={group.id} />
//             </>
//           )}
//         </div>
//       ))}

//       <div className={styles.block}>
//         <h2 onClick={() => setExpandedGroups(prev => ({ ...prev, tournament: !prev.tournament }))}>
//           🏆 Tournament Standings {expandedGroups.tournament ? '▾' : '▸'}
//         </h2>

//         {expandedGroups.tournament && (
//           <TournamentStandings tournamentId={id as string} />
//         )}
//       </div>

//     </div>
//   )
// }

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
  home_team: { id: string; name: string }
  away_team: { id: string; name: string }
}

export default function PublicStageDetailPage() {
  const { id, stageId } = useParams()
  const router = useRouter()

  const [groups, setGroups] = useState<Group[]>([])
  const [matchesByGroup, setMatchesByGroup] = useState<Record<string, Match[]>>({})
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [showToday, setShowToday] = useState<boolean>(true)
  const [showUpcoming, setShowUpcoming] = useState<boolean>(true)
  const [allStages, setAllStages] = useState<{ id: string; stage_name: string }[]>([])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  useEffect(() => {
    const fetchStages = async () => {
      const { data, error } = await supabase
        .from('tournament_stages')
        .select('id, stage_name')
        .eq('tournament_id', id)

      if (!error) setAllStages(data || [])
    }

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

    fetchStages()
    fetchGroups()
    fetchMatches()
  }, [id, stageId])

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

      {/* Stage Dropdown */}
      <div className={styles.stageSelector}>
        <label htmlFor="stage-select">Select Stage:</label>
        {allStages.length === 0 ? (
          <p>Loading stages...</p>
        ) : (
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
        )}
      </div>

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

      {/* Group Matches & Standings */}
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

      {/* Overall Tournament Standings */}
      <TournamentStandings tournamentId={id as string} />
    </div>
  )
}
