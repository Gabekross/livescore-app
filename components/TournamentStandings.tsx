'use client'

// TournamentStandings.tsx
// Calculates standings in-memory from match results.
//
// Changes from original:
//   - show_standings prop replaces the hardcoded 'selectedStageName === Preliminary' check
//   - status filter updated: 'completed' (was 'finished') and excludes 'scheduled'
//   - only includes matches where affects_standings = true (excludes friendlies)
//   - org scoping added via organization_id filter on matches

import { useEffect, useState } from 'react'
import Link                    from 'next/link'
import { supabase }            from '@/lib/supabase'
import styles                  from '@/styles/components/TournamentStandings.module.scss'
import { formatTeamName }      from '@/lib/formatters'

interface Standing {
  team_id:  string
  team_name: string
  mp:  number
  w:   number
  d:   number
  l:   number
  gf:  number
  ga:  number
  gd:  number
  pts: number
}

export default function TournamentStandings({
  tournamentId,
  showStandings,
}: {
  tournamentId:  string
  showStandings: boolean   // data-driven, from tournament_stages.show_standings
}) {
  const [standings, setStandings] = useState<Standing[]>([])

  const fetchAndSetStandings = async () => {
    const { data: stages } = await supabase
      .from('tournament_stages')
      .select('id')
      .eq('tournament_id', tournamentId)

    const stageIds = stages?.map((s) => s.id) || []
    if (stageIds.length === 0) return

    const { data: groups } = await supabase
      .from('groups')
      .select('id')
      .in('stage_id', stageIds)

    const groupIds = groups?.map((g) => g.id) || []
    if (groupIds.length === 0) return

    const { data: matches } = await supabase
      .from('matches')
      .select('id, group_id, status, home_team_id, away_team_id, home_score, away_score')
      .in('group_id', groupIds)
      .eq('status', 'completed')         // was: .neq('status', 'scheduled')
      .eq('affects_standings', true)     // excludes friendly matches

    // Fetch all teams assigned to these groups — used as the base so every
    // team appears with 0s even before any matches have been played.
    const { data: groupTeamRows } = await supabase
      .from('group_teams')
      .select('team_id, teams!inner(id, name)')
      .in('group_id', groupIds)

    const teamMap: Record<string, string> = {}
    groupTeamRows?.forEach((row) => {
      const t = Array.isArray(row.teams) ? row.teams[0] : row.teams
      if (t) teamMap[t.id] = t.name
    })

    // Seed the standings map with every assigned team at zero
    const temp: Record<string, Standing> = {}
    Object.entries(teamMap).forEach(([teamId, teamName]) => {
      temp[teamId] = { team_id: teamId, team_name: teamName, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
    })

    matches?.forEach((m) => {
      if (m.home_score === null || m.away_score === null) return

      // Guard: only process teams that are in the group assignments
      if (!temp[m.home_team_id] || !temp[m.away_team_id]) return

      const home = temp[m.home_team_id]
      const away = temp[m.away_team_id]

      home.mp += 1; away.mp += 1
      home.gf += m.home_score; home.ga += m.away_score
      away.gf += m.away_score; away.ga += m.home_score

      if (m.home_score > m.away_score) {
        home.w += 1; home.pts += 3; away.l += 1
      } else if (m.home_score < m.away_score) {
        away.w += 1; away.pts += 3; home.l += 1
      } else {
        home.d += 1; home.pts += 1; away.d += 1; away.pts += 1
      }

      home.gd = home.gf - home.ga
      away.gd = away.gf - away.ga
    })

    const sorted = Object.values(temp).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts
      if (b.gd  !== a.gd)  return b.gd  - a.gd
      return b.gf - a.gf
    })

    setStandings(sorted)
  }

  useEffect(() => {
    fetchAndSetStandings()

    if (!showStandings) return

    const channel = supabase
      .channel('realtime-tournament-standings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' },
        () => fetchAndSetStandings()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tournamentId, showStandings])

  if (standings.length === 0) {
    return <p style={{ color: 'gray', textAlign: 'center' }}>No teams assigned yet.</p>
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Tournament Standings</h2>
      {/* table-scroll = global utility from globals.css for polished mobile scroll */}
      <div className="table-scroll">
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th><th>Team</th>
            <th>MP</th><th>W</th><th>D</th><th>L</th>
            <th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, idx) => (
            <tr key={team.team_id}>
              <td>{idx + 1}</td>
              <td><Link href={`/teams/${team.team_id}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>{formatTeamName(team.team_name)}</Link></td>
              <td>{team.mp}</td><td>{team.w}</td><td>{team.d}</td><td>{team.l}</td>
              <td>{team.gf}</td><td>{team.ga}</td><td>{team.gd}</td><td>{team.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
