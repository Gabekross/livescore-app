'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import styles from '@/styles/components/MatchEdit.module.scss'
import Link from 'next/link'

const FORMATIONS = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2']

export default function EditMatchPage() {
  const rawParams = useParams()
  const matchId = Array.isArray(rawParams.matchId) ? rawParams.matchId[0] : rawParams.matchId
  const id = Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id
  const stageId = Array.isArray(rawParams.stageId) ? rawParams.stageId[0] : rawParams.stageId
  const groupId = Array.isArray(rawParams.groupId) ? rawParams.groupId[0] : rawParams.groupId
  const router = useRouter()

  const [homeTeam, setHomeTeam] = useState<any>(null)
  const [awayTeam, setAwayTeam] = useState<any>(null)
  const [homeScore, setHomeScore] = useState<number | null>(null)
  const [awayScore, setAwayScore] = useState<number | null>(null)
  const [status, setStatus] = useState('scheduled')
  const [homeFormation, setHomeFormation] = useState('')
  const [awayFormation, setAwayFormation] = useState('')
  const [homePlayers, setHomePlayers] = useState<any[]>([])
  const [awayPlayers, setAwayPlayers] = useState<any[]>([])
  const [selectedHomeLineup, setSelectedHomeLineup] = useState<string[]>([])
  const [selectedAwayLineup, setSelectedAwayLineup] = useState<string[]>([])
  const [benchHome, setBenchHome] = useState<string[]>([])
  const [benchAway, setBenchAway] = useState<string[]>([])
  const [playerStats, setPlayerStats] = useState<Record<string, { goals?: number; assists?: number; yellow_cards?: number; red_cards?: number }>>({})

  useEffect(() => {
    const fetchMatch = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id, home_score, away_score, status, home_formation, away_formation,
          home_team:home_team_id(id, name),
          away_team:away_team_id(id, name)
        `)
        .eq('id', matchId)
        .single()

      if (data) {
        const home = Array.isArray(data.home_team) ? data.home_team[0] : data.home_team
        const away = Array.isArray(data.away_team) ? data.away_team[0] : data.away_team

        setHomeTeam(home)
        setAwayTeam(away)
        setHomeScore(data.home_score ?? 0)
        setAwayScore(data.away_score ?? 0)
        setStatus(data.status ?? 'scheduled')
        setHomeFormation(data.home_formation || '')
        setAwayFormation(data.away_formation || '')

        const teamIds = [home.id, away.id]
        const { data: players } = await supabase
          .from('players')
          .select('id, name, jersey_number, team_id')
          .in('team_id', teamIds)

        if (players) {
          setHomePlayers(players.filter(p => p.team_id === home.id))
          setAwayPlayers(players.filter(p => p.team_id === away.id))
        }

        const { data: existingLineups } = await supabase
          .from('match_lineups')
          .select('player_id, is_starting, team_id, goals, assists, yellow_cards, red_cards')
          .eq('match_id', matchId)

        if (existingLineups) {
          const homeLineup = existingLineups.filter(p => p.team_id === home.id && p.is_starting).map(p => p.player_id)
          const awayLineup = existingLineups.filter(p => p.team_id === away.id && p.is_starting).map(p => p.player_id)
          const homeBench = existingLineups.filter(p => p.team_id === home.id && !p.is_starting).map(p => p.player_id)
          const awayBench = existingLineups.filter(p => p.team_id === away.id && !p.is_starting).map(p => p.player_id)

          const statMap: Record<string, any> = {}
          existingLineups.forEach(p => {
            statMap[p.player_id] = {
              goals: p.goals ?? 0,
              assists: p.assists ?? 0,
              yellow_cards: p.yellow_cards ?? 0,
              red_cards: p.red_cards ?? 0,
            }
          })

          setSelectedHomeLineup(homeLineup)
          setSelectedAwayLineup(awayLineup)
          setBenchHome(homeBench)
          setBenchAway(awayBench)
          setPlayerStats(statMap)
        }
      } else {
        toast.error('Match not found')
      }
    }

    fetchMatch()
  }, [matchId])

  const togglePlayerSelection = (id: string, team: 'home' | 'away', isBench = false) => {
    const lineupSetter = team === 'home' ? setSelectedHomeLineup : setSelectedAwayLineup
    const benchSetter = team === 'home' ? setBenchHome : setBenchAway
    const currentLineup = team === 'home' ? selectedHomeLineup : selectedAwayLineup
    const currentBench = team === 'home' ? benchHome : benchAway

    if (!isBench) {
      if (currentLineup.includes(id)) {
        lineupSetter(currentLineup.filter(pid => pid !== id))
      } else {
        lineupSetter([...currentLineup, id])
        benchSetter(currentBench.filter(pid => pid !== id))
      }
    } else {
      if (currentBench.includes(id)) {
        benchSetter(currentBench.filter(pid => pid !== id))
      } else {
        benchSetter([...currentBench, id])
        lineupSetter(currentLineup.filter(pid => pid !== id))
      }
    }
  }

  const handleStatChange = (playerId: string, key: string, value: number) => {
    setPlayerStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [key]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error: matchError } = await supabase
      .from('matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status,
        home_formation: homeFormation,
        away_formation: awayFormation
      })
      .eq('id', matchId)

    if (matchError) {
      toast.error('Failed to update match')
      return
    }

    const allPlayers = [
      ...selectedHomeLineup.map(id => ({ id, team: homeTeam.id, is_starting: true })),
      ...benchHome.map(id => ({ id, team: homeTeam.id, is_starting: false })),
      ...selectedAwayLineup.map(id => ({ id, team: awayTeam.id, is_starting: true })),
      ...benchAway.map(id => ({ id, team: awayTeam.id, is_starting: false }))
    ]

    const rows = allPlayers.map(p => ({
      match_id: matchId,
      player_id: p.id,
      team_id: p.team,
      is_starting: p.is_starting,
      ...playerStats[p.id]
    }))

    const { error: upsertError } = await supabase
      .from('match_lineups')
      .upsert(rows, { onConflict: 'match_id,player_id' })

    if (upsertError) {
      toast.error('Failed to save player stats')
      return
    }

    toast.success('Match updated successfully')
    router.push(`/admin/tournaments/${id}/stages/${stageId}/groups/${groupId}/matches`)
  }

  const renderPlayerRow = (player: any, selected: string[], isBench: boolean, team: 'home' | 'away') => {
    const isChecked = selected.includes(player.id)
    const stats = playerStats[player.id] || {}

    return (
      <div key={player.id} className={styles.playerRow}>
        <label>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => togglePlayerSelection(player.id, team, isBench)}
          />
          #{player.jersey_number} {player.name}
        </label>
        {isChecked && (
          <div className={styles.statInputs}>
            <input type="number" placeholder="G" value={stats.goals || 0} onChange={(e) => handleStatChange(player.id, 'goals', Number(e.target.value))} />
            <input type="number" placeholder="A" value={stats.assists || 0} onChange={(e) => handleStatChange(player.id, 'assists', Number(e.target.value))} />
            <input type="number" placeholder="🟨" value={stats.yellow_cards || 0} onChange={(e) => handleStatChange(player.id, 'yellow_cards', Number(e.target.value))} />
            <input type="number" placeholder="🟥" value={stats.red_cards || 0} onChange={(e) => handleStatChange(player.id, 'red_cards', Number(e.target.value))} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Link href={`/admin/tournaments/${id}/stages/`} className={styles.backButton}>
        ← Back to Stages
      </Link>

      <h2 className={styles.heading}>Edit Match</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label>Home Score</label>
        <input type="number" value={homeScore ?? ''} onChange={e => setHomeScore(Number(e.target.value))} className={styles.input} />

        <label>Away Score</label>
        <input type="number" value={awayScore ?? ''} onChange={e => setAwayScore(Number(e.target.value))} className={styles.input} />

        <label>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value)} className={styles.select}>
          <option value="scheduled">Scheduled</option>
          <option value="ongoing">Ongoing</option>
          <option value="halftime">Halftime</option>
          <option value="finished">Finished</option>
        </select>

        <label>Home Formation</label>
        <select value={homeFormation} onChange={e => setHomeFormation(e.target.value)} className={styles.select}>
          {FORMATIONS.map(f => <option key={f}>{f}</option>)}
        </select>

        <label>Away Formation</label>
        <select value={awayFormation} onChange={e => setAwayFormation(e.target.value)} className={styles.select}>
          {FORMATIONS.map(f => <option key={f}>{f}</option>)}
        </select>

        <div className={styles.lineupSection}>
          <h3>{homeTeam?.name} Starters</h3>
          {homePlayers.map(p => renderPlayerRow(p, selectedHomeLineup, false, 'home'))}
          <h3>{homeTeam?.name} Bench</h3>
          {homePlayers.map(p => renderPlayerRow(p, benchHome, true, 'home'))}
        </div>

        <div className={styles.lineupSection}>
          <h3>{awayTeam?.name} Starters</h3>
          {awayPlayers.map(p => renderPlayerRow(p, selectedAwayLineup, false, 'away'))}
          <h3>{awayTeam?.name} Bench</h3>
          {awayPlayers.map(p => renderPlayerRow(p, benchAway, true, 'away'))}
        </div>

        <button type="submit" className={styles.button}>Update Match</button>
      </form>
    </div>
  )
}
