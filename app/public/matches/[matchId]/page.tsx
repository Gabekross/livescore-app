'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CombinedFormationField from '@/components/match/FormationField'
import styles from '@/styles/components/MatchDetail.module.scss'

interface Match {
  id: string
  match_date: string
  venue?: string
  status: string
  home_score: number | null
  away_score: number | null
  home_formation?: string
  away_formation?: string
  home_team: { id: string; name: string; logo_url?: string }
  away_team: { id: string; name: string; logo_url?: string }
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
  const [homeLineup, setHomeLineup] = useState<Player[]>([])
  const [awayLineup, setAwayLineup] = useState<Player[]>([])
  const [homeBench, setHomeBench] = useState<Player[]>([])
  const [awayBench, setAwayBench] = useState<Player[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchMatch = async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        id, match_date, venue, status, home_score, away_score,
        home_formation, away_formation,
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

  const fetchLineups = async () => {
    if (!match) return

    const { data, error } = await supabase
      .from('match_lineups')
      .select(`
        player_id,
        team_id,
        is_starting,
        goals,
        yellow_cards,
        red_cards,
        players(id, name, jersey_number)
      `)
      .eq('match_id', match.id)

    if (error) {
      console.error('Lineup fetch error:', error)
      return
    }

    const normalize = (p: any): Player => {
      const player = Array.isArray(p.players) ? p.players[0] : p.players
      return {
        id: player?.id,
        name: player?.name,
        jersey_number: player?.jersey_number,
        team_id: p.team_id,
        goals: p?.goals,
        yellow_cards: p?.yellow_cards,
        red_cards: p?.red_cards
      }
    }

    setHomeLineup(data.filter(p => p.team_id === match.home_team.id && p.is_starting && p.players).map(normalize))
    setAwayLineup(data.filter(p => p.team_id === match.away_team.id && p.is_starting && p.players).map(normalize))
    setHomeBench(data.filter(p => p.team_id === match.home_team.id && !p.is_starting && p.players).map(normalize))
    setAwayBench(data.filter(p => p.team_id === match.away_team.id && !p.is_starting && p.players).map(normalize))
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await fetchMatch()
    await fetchLineups()
    setIsRefreshing(false)
  }

  useEffect(() => {
    fetchMatch()
  }, [matchId])

  useEffect(() => {
    if (match) {
      fetchLineups()
      const interval = setInterval(refreshData, 10000)
      return () => clearInterval(interval)
    }
  }, [match])

  if (!match) return <div className={styles.container}>Loading match details...</div>

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => router.back()}>
        ← Back
      </button>

      <div className={styles.matchHeader}>
        <h1>
          {match.home_team.logo_url && <img src={match.home_team.logo_url} className={styles.teamLogo} alt="Home Logo" />}
          {match.home_team.name} vs {match.away_team.name}
          {match.away_team.logo_url && <img src={match.away_team.logo_url} className={styles.teamLogo} alt="Away Logo" />}
        </h1>
        <p>{new Date(match.match_date).toLocaleDateString()} at {match.venue || 'TBD'}</p>
        <h2 className={styles.score}>
          {match.home_score ?? '-'} – {match.away_score ?? '-'}
        </h2>
        <p className={styles.status}>
          Status: {match.status?.toUpperCase() || 'SCHEDULED'}
          {isRefreshing && <span className={styles.spinner}>⏳</span>}
        </p>
      </div>

      <CombinedFormationField
        home={{
          name: match.home_team.name,
          logo: match.home_team.logo_url,
          players: homeLineup,
          formation: match.home_formation || '4-3-3'
        }}
        away={{
          name: match.away_team.name,
          logo: match.away_team.logo_url,
          players: awayLineup,
          formation: match.away_formation || '4-3-3'
        }}
      />
<div className={styles.benchContainer}>
  <div className={styles.benchCard}>
    <h4>Substitutes – {match.home_team.name}</h4>
    <div className={styles.benchList}>
      {homeBench.map(player => (
        <div key={player.id} className={styles.benchItem}>
          <div className={`${styles.playerDot} ${styles.homeDot}`}>
            {player.jersey_number ?? ''}
          </div>
          <div className={styles.playerInfo}>
            <div className={styles.playerName}>
              {player.name} <span className={styles.subIcon}>🔁</span>
            </div>
            <div className={styles.iconsInline}>
              {player.goals ? `⚽ ${player.goals} ` : ''}
              {player.yellow_cards ? `🟨 ${player.yellow_cards} ` : ''}
              {player.red_cards ? `🟥 ${player.red_cards}` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>

  <div className={styles.benchCard}>
    <h4>Substitutes – {match.away_team.name}</h4>
    <div className={styles.benchList}>
      {awayBench.map(player => (
        <div key={player.id} className={styles.benchItem}>
          <div className={`${styles.playerDot} ${styles.awayDot}`}>
            {player.jersey_number ?? ''}
          </div>
          <div className={styles.playerInfo}>
            <div className={styles.playerName}>
              {player.name} <span className={styles.subIcon}>🔁</span>
            </div>
            <div className={styles.iconsInline}>
              {player.goals ? `⚽ ${player.goals} ` : ''}
              {player.yellow_cards ? `🟨 ${player.yellow_cards} ` : ''}
              {player.red_cards ? `🟥 ${player.red_cards}` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>




    </div>
  )
}
