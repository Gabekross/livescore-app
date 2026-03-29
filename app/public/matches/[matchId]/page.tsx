'use client'

// app/public/matches/[matchId]/page.tsx
// Public match detail page — mirrors /matches/[matchId] using the same
// modern tabbed layout. Uses MatchDetailNew styles.

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter }             from 'next/navigation'
import Link                                 from 'next/link'
import { supabase }                         from '@/lib/supabase'
import { YellowCard, RedCard }              from '@/components/ui/CardIcon'
import CombinedFormationField               from '@/components/match/FormationField'
import StatusBadge                          from '@/components/ui/StatusBadge'
import TeamLogo                             from '@/components/ui/TeamLogo'
import { positionShort, positionGroupColor } from '@/lib/constants/positions'
import { isActiveMatch }                    from '@/lib/utils/match'
import type { MatchStatus }                 from '@/lib/utils/match'
import styles                               from '@/styles/components/MatchDetailNew.module.scss'

interface Team  { id: string; name: string; logo_url?: string | null; coach_name?: string | null }
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
  position?:      string
  team_id:        string
  goals?:         number
  assists?:       number
  yellow_cards?:  number
  red_cards?:     number
}

type Tab = 'formation' | 'teams'

export default function MatchDetailPage() {
  const { matchId } = useParams()
  const router      = useRouter()

  const [match,      setMatch]      = useState<Match | null>(null)
  const [homeLineup, setHomeLineup] = useState<Player[]>([])
  const [awayLineup, setAwayLineup] = useState<Player[]>([])
  const [homeBench,  setHomeBench]  = useState<Player[]>([])
  const [awayBench,  setAwayBench]  = useState<Player[]>([])
  const [activeTab,  setActiveTab]  = useState<Tab>('formation')

  const fetchMatch = useCallback(async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        id, match_date, venue, status, match_type,
        home_score, away_score, home_formation, away_formation,
        home_team:home_team_id(id, name, logo_url, coach_name),
        away_team:away_team_id(id, name, logo_url, coach_name)
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
        player_id, team_id, is_starting, formation_slot,
        goals, assists, yellow_cards, red_cards,
        players(id, name, jersey_number, position)
      `)
      .eq('match_id', currentMatch.id)

    if (error || !data) return

    const normalize = (p: Record<string, unknown>): Player & { _slot: number | null } => {
      const player = Array.isArray(p.players) ? p.players[0] : p.players as Record<string, unknown>
      return {
        id:            player?.id as string,
        name:          player?.name as string,
        jersey_number: player?.jersey_number as number | undefined,
        position:      player?.position as string | undefined,
        team_id:       p.team_id as string,
        goals:         p.goals as number | undefined,
        assists:       p.assists as number | undefined,
        yellow_cards:  p.yellow_cards as number | undefined,
        red_cards:     p.red_cards as number | undefined,
        _slot:         (p.formation_slot as number | null) ?? null,
      }
    }

    const sortBySlot = (arr: (Player & { _slot: number | null })[]) =>
      [...arr].sort((a, b) => {
        if (a._slot != null && b._slot != null) return a._slot - b._slot
        if (a._slot != null) return -1
        if (b._slot != null) return 1
        return 0
      })

    const homeId = currentMatch.home_team.id
    const awayId = currentMatch.away_team.id

    setHomeLineup(sortBySlot(data.filter((p) => p.team_id === homeId && p.is_starting  && p.players).map(normalize)))
    setAwayLineup(sortBySlot(data.filter((p) => p.team_id === awayId && p.is_starting  && p.players).map(normalize)))
    setHomeBench(data.filter( (p) => p.team_id === homeId && !p.is_starting && p.players).map(normalize))
    setAwayBench(data.filter( (p) => p.team_id === awayId && !p.is_starting && p.players).map(normalize))
  }, [])

  useEffect(() => { fetchMatch() }, [fetchMatch])
  useEffect(() => { if (match) fetchLineups(match) }, [match, fetchLineups])

  // Realtime
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
  const hasLineups = homeLineup.length > 0 || awayLineup.length > 0
  const hasBench   = homeBench.length > 0 || awayBench.length > 0

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <button onClick={() => router.back()} className={styles.back}>← Back</button>

        {/* Match header */}
        <div className={styles.matchHeader}>
          <div className={styles.badges}>
            {active && <StatusBadge status={match.status} matchDate={match.match_date} />}
            {isFriendly && <span className={styles.friendlyBadge}>Friendly</span>}
          </div>

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
                  <span className={styles.vsText}>vs</span>
                )}
              </div>
              {!active && <StatusBadge status={match.status} matchDate={match.match_date} />}
            </div>
            <div className={styles.teamSide}>
              <TeamLogo src={match.away_team.logo_url} alt={match.away_team.name} size={48} />
              <span className={styles.teamName}>{match.away_team.name}</span>
            </div>
          </div>

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

        {/* Tab bar */}
        {hasLineups && (
          <>
            <div className={styles.tabBar}>
              <button
                className={`${styles.tab} ${activeTab === 'formation' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('formation')}
              >
                Formation
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'teams' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('teams')}
              >
                Teams
              </button>
            </div>

            {activeTab === 'formation' && (
              <div className={styles.section}>
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

                {hasBench && (
                  <div className={styles.benchSection}>
                    <div className={styles.benchSectionTitle}>Substitutes</div>
                    <div className={styles.benchGrid}>
                      <BenchCol teamName={match.home_team.name} players={homeBench} isHome />
                      <BenchCol teamName={match.away_team.name} players={awayBench} isHome={false} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'teams' && (
              <div className={styles.section}>
                <div className={styles.squadGrid}>
                  <SquadCol team={match.away_team} starters={awayLineup} bench={awayBench} isHome={false} formation={match.away_formation} />
                  <SquadCol team={match.home_team} starters={homeLineup} bench={homeBench} isHome formation={match.home_formation} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Helper components ─────────────────────────────────────────────

function BenchCol({ teamName, players, isHome }: { teamName: string; players: Player[]; isHome: boolean }) {
  if (players.length === 0) return null
  return (
    <div className={styles.benchTeam}>
      <h4>{teamName}</h4>
      <div className={styles.benchList}>
        {players.map((p) => (
          <div key={p.id} className={styles.benchItem}>
            <span className={`${styles.jerseyBadge} ${isHome ? styles.homeBadge : styles.awayBadge}`}>
              {p.jersey_number ?? '–'}
            </span>
            <span className={styles.benchPlayerName}>{p.name}</span>
            <StatIcons player={p} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SquadCol({ team, starters, bench, isHome, formation }: {
  team: { id: string; name: string; logo_url?: string | null; coach_name?: string | null }
  starters: Player[]; bench: Player[]; isHome: boolean; formation?: string
}) {
  return (
    <div className={styles.squadColumn}>
      <div className={styles.squadHeader}>
        <TeamLogo src={team.logo_url} alt={team.name} size={32} />
        <div>
          <div className={styles.squadTeamName}>{team.name}</div>
          {formation && <div className={styles.squadFormation}>{formation}</div>}
        </div>
      </div>
      {starters.length > 0 && (
        <div className={styles.squadSection}>
          <div className={styles.squadSectionLabel}>Starting XI</div>
          {starters.map((p) => <SquadRow key={p.id} player={p} isHome={isHome} />)}
        </div>
      )}
      {bench.length > 0 && (
        <div className={styles.squadSection}>
          <div className={styles.squadSectionLabel}>Substitutes</div>
          {bench.map((p) => <SquadRow key={p.id} player={p} isHome={isHome} />)}
        </div>
      )}
      {team.coach_name && (
        <div className={styles.squadSection}>
          <div className={styles.squadSectionLabel}>Coach</div>
          <div className={styles.squadCoach}>
            <span className={styles.coachIcon}>👔</span>
            <span className={styles.squadPlayerName}>{team.coach_name}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function SquadRow({ player, isHome }: { player: Player; isHome: boolean }) {
  const pos = positionShort(player.position)
  const posColor = positionGroupColor(player.position)
  return (
    <div className={styles.squadPlayer}>
      <span className={`${styles.jerseyBadge} ${isHome ? styles.homeBadge : styles.awayBadge}`}>
        {player.jersey_number ?? '–'}
      </span>
      <div className={styles.squadPlayerInfo}>
        <span className={styles.squadPlayerName}>{player.name}</span>
        {pos && <span className={styles.positionBadge} style={{ color: posColor, borderColor: `${posColor}44` }}>{pos}</span>}
      </div>
      <StatIcons player={player} />
    </div>
  )
}

function StatIcons({ player }: { player: Player }) {
  const g = (player.goals ?? 0) > 0
  const a = (player.assists ?? 0) > 0
  const y = (player.yellow_cards ?? 0) > 0
  const r = (player.red_cards ?? 0) > 0
  if (!g && !a && !y && !r) return null
  return (
    <span className={styles.statIcons}>
      {g && <span>⚽{(player.goals ?? 0) > 1 ? player.goals : ''}</span>}
      {a && <span className={styles.assistLabel}>A{(player.assists ?? 0) > 1 ? player.assists : ''}</span>}
      {y && <YellowCard size={14} />}
      {r && <RedCard size={14} />}
    </span>
  )
}
