'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/MatchDetail.module.scss'

interface Match {
  id: string
  match_date: string
  venue?: string
  status: string
  home_team: { id: string; name: string; logo_url?: string }
  away_team: { id: string; name: string; logo_url?: string }
  home_score: number | null
  away_score: number | null
}

interface Player {
  id: string
  name: string
  jersey_number?: number
  team_id: string
  goals?: number
  yellow_cards?: number
  red_cards?: number
}

export default function MatchDetailPage() {
  const { matchId } = useParams()
  const router = useRouter()

  const [match, setMatch] = useState<Match | null>(null)
  const [homePlayers, setHomePlayers] = useState<Player[]>([])
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchMatch = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        venue,
        status,
        home_score,
        away_score,
        home_team:home_team_id(id, name, logo_url),
        away_team:away_team_id(id, name, logo_url)
      `)
      .eq('id', matchId)
      .single()

    if (data) {
      setMatch({
        ...data,
        home_team: Array.isArray(data.home_team) ? data.home_team[0] : data.home_team,
        away_team: Array.isArray(data.away_team) ? data.away_team[0] : data.away_team,
      })
    }
  }

  const fetchPlayers = async () => {
    if (!match) return
    const { data } = await supabase
      .from('players')
      .select('id, name, jersey_number, team_id, goals, yellow_cards, red_cards')
      .in('team_id', [match.home_team.id, match.away_team.id])

    if (data) {
      const home = data.filter(p => p.team_id === match.home_team.id)
      const away = data.filter(p => p.team_id === match.away_team.id)
      setHomePlayers(home)
      setAwayPlayers(away)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await fetchMatch()
    await fetchPlayers()
    setIsRefreshing(false)
  }

  useEffect(() => {
    fetchMatch()
  }, [matchId])

  useEffect(() => {
    if (match) {
      fetchPlayers()

      // Set interval to refresh live every 10 seconds
      const interval = setInterval(() => {
        refreshData()
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [match])

  if (!match) {
    return <div className={styles.container}>Loading match details...</div>
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => router.back()}>
        ← Back
      </button>

      <div className={styles.matchHeader}>
        <h1>
          {match.home_team.name} vs {match.away_team.name}
        </h1>
        <p>{new Date(match.match_date).toLocaleDateString()} at {match.venue || 'TBD'}</p>

        <h2 className={styles.score}>
          {match.home_score ?? '-'} – {match.away_score ?? '-'}
        </h2>

        <p className={styles.status}>
          Status: {match.status?.toUpperCase() ||'SCHEDULED'}
          {isRefreshing && <span className={styles.spinner}>⏳</span>}
        </p>
      </div>

      <div className={styles.teamsContainer}>
        <div className={styles.teamSection}>
          <h3> {match.home_team.logo_url && (
                      <img src={match.home_team.logo_url} alt="home logo" className={styles.logo} />
                    )} {match.home_team.name}</h3>
          <ul className={styles.playerList}>
            {homePlayers.map((player) => (
              <li key={player.id}>
                #{player.jersey_number ?? ''} {player.name}
                <div className={styles.playerStats}>
                  {player.goals ? `⚽ ${player.goals}` : ''} 
                  {player.yellow_cards ? ` 🟨 ${player.yellow_cards}` : ''} 
                  {player.red_cards ? ` 🟥 ${player.red_cards}` : ''}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.teamSection}>
          <h3> {match.away_team.logo_url && (
                      <img src={match.away_team.logo_url} alt="away logo" className={styles.logo} />
                    )} {match.away_team.name}</h3>
          <ul className={styles.playerList}>
            {awayPlayers.map((player) => (
              <li key={player.id}>
                #{player.jersey_number ?? ''} {player.name}
                <div className={styles.playerStats}>
                  {player.goals ? `⚽ ${player.goals}` : ''} 
                  {player.yellow_cards ? ` 🟨 ${player.yellow_cards}` : ''} 
                  {player.red_cards ? ` 🟥 ${player.red_cards}` : ''}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
