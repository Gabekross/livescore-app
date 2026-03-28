'use client'

// app/matches/[matchId]/page.tsx
// Public match detail — realtime updates via Supabase postgres_changes.
// Displays scoreline, formation field, lineups, bench, and player stats.

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter }              from 'next/navigation'
import Link                                  from 'next/link'
import { supabase }                          from '@/lib/supabase'
import { YellowCard, RedCard }               from '@/components/ui/CardIcon'
import CombinedFormationField                from '@/components/match/FormationField'
import StatusBadge                           from '@/components/ui/StatusBadge'
import TeamLogo                              from '@/components/ui/TeamLogo'
import { matchStatusLabel, isActiveMatch, scorelineFull } from '@/lib/utils/match'
import type { MatchStatus }                  from '@/lib/utils/match'
import styles                                from '@/styles/components/MatchDetailNew.module.scss'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Team  { id: string; name: string; logo_url?: string | null }
interface Match {
  id:              string
  match_date:      string
  venue?:          string
  status:          MatchStatus
  match_type:      string
  home_score:      number | null
  away_score:      number | null
  home_formation?: string
  away_formation?: string
  home_team:       Team
  away_team:       Team
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function MatchDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const matchId = params?.matchId as string

  const [match,      setMatch]      = useState<Match | null>(null)
  const [homeLineup, setHomeLineup] = useState<Player[]>([])
  const [awayLineup, setAwayLineup] = useState<Player[]>([])
  const [homeBench,  setHomeBench]  = useState<Player[]>([])
  const [awayBench,  setAwayBench]  = useState<Player[]>([])

  // ── Fetch match ────────────────────────────────────────────────────────
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

  // ── Fetch lineups ──────────────────────────────────────────────────────
  const fetchLineups = useCallback(async (m: Match) => {
    const { data, error } = await supabase
      .from('match_lineups')
      .select(`
        player_id, team_id, is_starting,
        goals, assists, yellow_cards, red_cards,
        players(id, name, jersey_number)
      `)
      .eq('match_id', m.id)

    if (error || !data) return

    const normalise = (p: Record<string, unknown>): Player => {
      const pl = Array.isArray(p.players) ? p.players[0] : (p.players as Record<string, unknown>)
      return {
        id:            pl?.id as string,
        name:          pl?.name as string,
        jersey_number: pl?.jersey_number as number | undefined,
        team_id:       p.team_id as string,
        goals:         p.goals         as number | undefined,
        assists:       p.assists       as number | undefined,
        yellow_cards:  p.yellow_cards  as number | undefined,
        red_cards:     p.red_cards     as number | undefined,
      }
    }

    const homeId = m.home_team.id
    const awayId = m.away_team.id

    setHomeLineup(data.filter((p) => p.team_id === homeId &&  p.is_starting && p.players).map(normalise))
    setAwayLineup(data.filter((p) => p.team_id === awayId &&  p.is_starting && p.players).map(normalise))
    setHomeBench( data.filter((p) => p.team_id === homeId && !p.is_starting && p.players).map(normalise))
    setAwayBench( data.filter((p) => p.team_id === awayId && !p.is_starting && p.players).map(normalise))
  }, [])

  useEffect(() => { fetchMatch() }, [fetchMatch])
  useEffect(() => { if (match) fetchLineups(match) }, [match, fetchLineups])

  // ── Realtime ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!matchId) return

    const channel = supabase
      .channel(`match-detail-${matchId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'matches',
        filter: `id=eq.${matchId}`,
      }, (payload) => {
        if (payload.new) {
          setMatch((prev) => prev ? { ...prev, ...(payload.new as Partial<Match>) } : null)
        }
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'match_lineups',
        filter: `match_id=eq.${matchId}`,
      }, () => {
        if (match) fetchLineups(match)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId, match, fetchLineups])

  // ── Loading ────────────────────────────────────────────────────────────
  if (!match) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.loading}>
            <span>⚽</span>
            <span>Loading match…</span>
          </div>
        </div>
      </div>
    )
  }

  const isFriendly = match.match_type === 'friendly'
  const active     = isActiveMatch(match.status)

  // ── Bench player row ───────────────────────────────────────────────────
  const BenchPlayerRow = ({ player, isHome }: { player: Player; isHome: boolean }) => (
    <div className={styles.benchItem}>
      <span className={`${styles.jerseyBadge} ${isHome ? styles.homeBadge : styles.awayBadge}`}>
        {player.jersey_number ?? '–'}
      </span>
      <span className={styles.benchPlayerName}>{player.name}</span>
      <span className={styles.benchStats}>
        {player.goals         ? `⚽${player.goals} `         : ''}
        {player.assists       ? `A${player.assists} `        : ''}
        {player.yellow_cards  ? <><YellowCard size={14} />{player.yellow_cards > 1 ? player.yellow_cards : ''} </> : ''}
        {player.red_cards     ? <><RedCard size={14} />{player.red_cards > 1 ? player.red_cards : ''}</> : ''}
      </span>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link href="/matches" className={styles.back}>← Back to Matches</Link>

        {/* Match header */}
        <div className={styles.matchHeader}>
          {/* Status badges */}
          <div className={styles.badges}>
            {active && (
              <StatusBadge status={match.status} matchDate={match.match_date} />
            )}
            {isFriendly && (
              <span style={{
                display: 'inline-flex', padding: '2px 8px',
                background: 'var(--color-friendly-bg)', color: 'var(--color-friendly)',
                border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-full)',
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                Friendly
              </span>
            )}
          </div>

          {/* Teams + score */}
          <div className={styles.teamsRow}>
            <div className={styles.teamSide}>
              <TeamLogo src={match.home_team.logo_url} alt={match.home_team.name} size={48} />
              <span className={styles.teamName}>{match.home_team.name}</span>
            </div>

            <div className={styles.scoreDisplay}>
              <div className={styles.score}>
                {match.home_score !== null && match.away_score !== null ? (
                  <>
                    <span>{match.home_score}</span>
                    <span className={styles.scoreDash}> – </span>
                    <span>{match.away_score}</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--color-text-dim)', fontSize: '1.4rem' }}>vs</span>
                )}
              </div>
              {!active && (
                <StatusBadge status={match.status} matchDate={match.match_date} />
              )}
            </div>

            <div className={styles.teamSide}>
              <TeamLogo src={match.away_team.logo_url} alt={match.away_team.name} size={48} />
              <span className={styles.teamName}>{match.away_team.name}</span>
            </div>
          </div>

          {/* Meta */}
          <div className={styles.matchMeta}>
            {new Date(match.match_date).toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
            {' · '}
            {new Date(match.match_date).toLocaleTimeString('en-GB', {
              hour: '2-digit', minute: '2-digit',
            })}
            {match.venue && <> · {match.venue}</>}
          </div>
        </div>

        {/* Formation */}
        {(homeLineup.length > 0 || awayLineup.length > 0) && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Formation</div>
            <CombinedFormationField
              home={{
                name:      match.home_team.name,
                logo:      match.home_team.logo_url ?? undefined,
                players:   homeLineup,
                formation: match.home_formation || '4-3-3',
              }}
              away={{
                name:      match.away_team.name,
                logo:      match.away_team.logo_url ?? undefined,
                players:   awayLineup,
                formation: match.away_formation || '4-3-3',
              }}
            />
          </div>
        )}

        {/* Bench */}
        {(homeBench.length > 0 || awayBench.length > 0) && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Substitutes</div>
            <div className={styles.benchGrid}>
              <div className={styles.benchTeam}>
                <h4>{match.home_team.name}</h4>
                <div className={styles.benchList}>
                  {homeBench.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                      No substitutes listed
                    </span>
                  ) : (
                    homeBench.map((p) => (
                      <BenchPlayerRow key={p.id} player={p} isHome />
                    ))
                  )}
                </div>
              </div>
              <div className={styles.benchTeam}>
                <h4>{match.away_team.name}</h4>
                <div className={styles.benchList}>
                  {awayBench.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                      No substitutes listed
                    </span>
                  ) : (
                    awayBench.map((p) => (
                      <BenchPlayerRow key={p.id} player={p} isHome={false} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
