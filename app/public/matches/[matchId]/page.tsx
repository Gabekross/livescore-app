'use client'

// app/public/matches/[matchId]/page.tsx
// Public match detail page with live realtime updates.
// Subscribes to postgres_changes on the specific match row.
// Displays formation, lineup, bench, and all player stats.

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter }             from 'next/navigation'
import { supabase }                         from '@/lib/supabase'
import { YellowCard, RedCard }              from '@/components/ui/CardIcon'
import CombinedFormationField               from '@/components/match/FormationField'
import { matchStatusLabel, isActiveMatch, scorelineFull } from '@/lib/utils/match'
import type { MatchStatus }                 from '@/lib/utils/match'
import styles                               from '@/styles/components/MatchDetail.module.scss'

interface Match {
  id:             string
  match_date:     string
  venue?:         string
  status:         MatchStatus
  match_type:     string
  home_score:     number | null
  away_score:     number | null
  home_formation?: string
  away_formation?: string
  home_team: { id: string; name: string; logo_url?: string }
  away_team: { id: string; name: string; logo_url?: string }
}

interface Player {
  id:             string
  name:           string
  jersey_number?: number
  team_id:        string
  goals?:         number
  assists?:       number
  yellow_cards?:  number
  red_cards?:     number
}

export default function MatchDetailPage() {
  const { matchId } = useParams()
  const router      = useRouter()

  const [match,     setMatch]     = useState<Match | null>(null)
  const [homeLineup, setHomeLineup] = useState<Player[]>([])
  const [awayLineup, setAwayLineup] = useState<Player[]>([])
  const [homeBench,  setHomeBench]  = useState<Player[]>([])
  const [awayBench,  setAwayBench]  = useState<Player[]>([])

  const fetchMatch = useCallback(async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        id, match_date, venue, status, match_type,
        home_score, away_score, home_formation, away_formation,
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
  }, [matchId])

  const fetchLineups = useCallback(async (currentMatch: Match) => {
    const { data, error } = await supabase
      .from('match_lineups')
      .select(`
        player_id, team_id, is_starting,
        goals, assists, yellow_cards, red_cards,
        players(id, name, jersey_number)
      `)
      .eq('match_id', currentMatch.id)

    if (error || !data) return

    const normalize = (p: Record<string, unknown>): Player => {
      const player = Array.isArray(p.players) ? p.players[0] : p.players as Record<string, unknown>
      return {
        id:            player?.id as string,
        name:          player?.name as string,
        jersey_number: player?.jersey_number as number | undefined,
        team_id:       p.team_id as string,
        goals:         p.goals as number | undefined,
        assists:       p.assists as number | undefined,
        yellow_cards:  p.yellow_cards as number | undefined,
        red_cards:     p.red_cards as number | undefined,
      }
    }

    const homeId = currentMatch.home_team.id
    const awayId = currentMatch.away_team.id

    setHomeLineup(data.filter((p) => p.team_id === homeId && p.is_starting  && p.players).map(normalize))
    setAwayLineup(data.filter((p) => p.team_id === awayId && p.is_starting  && p.players).map(normalize))
    setHomeBench(data.filter( (p) => p.team_id === homeId && !p.is_starting && p.players).map(normalize))
    setAwayBench(data.filter( (p) => p.team_id === awayId && !p.is_starting && p.players).map(normalize))
  }, [])

  // Initial load
  useEffect(() => { fetchMatch() }, [fetchMatch])

  // Load lineups once match is available
  useEffect(() => {
    if (match) fetchLineups(match)
  }, [match, fetchLineups])

  // Realtime subscription — fires on any change to this specific match row
  useEffect(() => {
    if (!matchId) return

    const channel = supabase
      .channel(`match-detail-${matchId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'matches',
          filter: `id=eq.${matchId}`,
        },
        async (payload) => {
          if (payload.new) {
            // Merge the realtime update into local state instead of full refetch
            setMatch((prev) => prev ? { ...prev, ...(payload.new as Partial<Match>) } : null)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'match_lineups',
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          // Re-fetch lineups when they change
          if (match) fetchLineups(match)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId, match, fetchLineups])

  if (!match) {
    return <div className={styles.container}>Loading match details…</div>
  }

  const isFriendly = match.match_type === 'friendly'
  const active     = isActiveMatch(match.status)

  const BenchCard = ({ title, players }: { title: string; players: Player[] }) => (
    <div className={styles.benchCard}>
      <h4>{title}</h4>
      <div className={styles.benchList}>
        {players.length === 0
          ? <p style={{ color: '#888', fontSize: '0.85rem' }}>No substitutes listed</p>
          : players.map((player) => (
            <div key={player.id} className={styles.benchItem}>
              <div className={`${styles.playerDot} ${title.includes('home') ? styles.homeDot : styles.awayDot}`}>
                {player.jersey_number ?? ''}
              </div>
              <div className={styles.playerInfo}>
                <div className={styles.playerName}>
                  {player.name} <span className={styles.subIcon}>SUB</span>
                </div>
                <div className={styles.iconsInline}>
                  {player.goals       ? `⚽ ${player.goals} `       : ''}
                  {player.assists     ? `A ${player.assists} `      : ''}
                  {player.yellow_cards ? <><YellowCard size={14} />{player.yellow_cards > 1 ? player.yellow_cards : ''} </> : ''}
                  {player.red_cards   ? <><RedCard size={14} />{player.red_cards > 1 ? player.red_cards : ''}</> : ''}
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => router.back()}>← Back</button>

      <div className={styles.matchHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {isFriendly && (
            <span style={{
              background: '#f39c12', color: '#fff', fontSize: '0.7rem',
              padding: '2px 8px', borderRadius: '12px', fontWeight: 700, textTransform: 'uppercase',
            }}>
              Friendly
            </span>
          )}
          {active && (
            <span style={{
              background: '#e74c3c', color: '#fff', fontSize: '0.7rem',
              padding: '2px 8px', borderRadius: '12px', fontWeight: 700, animation: 'pulse 1.5s infinite',
            }}>
              ● LIVE
            </span>
          )}
        </div>

        <h1>
          {match.home_team.logo_url && (
            <img src={match.home_team.logo_url} className={styles.teamLogo} alt={match.home_team.name} />
          )}
          {match.home_team.name} vs {match.away_team.name}
          {match.away_team.logo_url && (
            <img src={match.away_team.logo_url} className={styles.teamLogo} alt={match.away_team.name} />
          )}
        </h1>

        <p>{new Date(match.match_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {match.venue || 'Venue TBD'}</p>

        <h2 className={styles.score}>{scorelineFull(match.home_score, match.away_score)}</h2>

        <p className={styles.status}>
          {matchStatusLabel(match.status, match.match_date)}
        </p>
      </div>

      <CombinedFormationField
        home={{
          name:      match.home_team.name,
          logo:      match.home_team.logo_url,
          players:   homeLineup,
          formation: match.home_formation || '4-3-3',
        }}
        away={{
          name:      match.away_team.name,
          logo:      match.away_team.logo_url,
          players:   awayLineup,
          formation: match.away_formation || '4-3-3',
        }}
      />

      <div className={styles.benchContainer}>
        <BenchCard title={`Substitutes – ${match.home_team.name}`} players={homeBench} />
        <BenchCard title={`Substitutes – ${match.away_team.name}`} players={awayBench} />
      </div>
    </div>
  )
}
