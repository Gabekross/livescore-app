'use client'

// app/matches/[matchId]/page.tsx
// Public match detail — realtime updates via Supabase postgres_changes.
// Tabbed experience: Formation | Teams
// Formation: two-team pitch with player dots, stats, events
// Teams: professional squad view (away left, home right)

import { useEffect, useState, useCallback } from 'react'
import { useParams }                         from 'next/navigation'
import Link                                  from 'next/link'
import { supabase }                          from '@/lib/supabase'
import { YellowCard, RedCard }               from '@/components/ui/CardIcon'
import CombinedFormationField                from '@/components/match/FormationField'
import StatusBadge                           from '@/components/ui/StatusBadge'
import TeamLogo                              from '@/components/ui/TeamLogo'
import { positionShort, positionGroupColor } from '@/lib/constants/positions'
import { isActiveMatch }                     from '@/lib/utils/match'
import type { MatchStatus }                  from '@/lib/utils/match'
import styles                                from '@/styles/components/MatchDetailNew.module.scss'

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function MatchDetailPage() {
  const params  = useParams()
  const matchId = params?.matchId as string

  const [match,      setMatch]      = useState<Match | null>(null)
  const [homeLineup, setHomeLineup] = useState<Player[]>([])
  const [awayLineup, setAwayLineup] = useState<Player[]>([])
  const [homeBench,  setHomeBench]  = useState<Player[]>([])
  const [awayBench,  setAwayBench]  = useState<Player[]>([])
  const [activeTab,  setActiveTab]  = useState<Tab>('formation')

  // ── Fetch match ────────────────────────────────────────────────────────
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

  // ── Fetch lineups ──────────────────────────────────────────────────────
  const fetchLineups = useCallback(async (m: Match) => {
    const { data, error } = await supabase
      .from('match_lineups')
      .select(`
        player_id, team_id, is_starting, formation_slot,
        goals, assists, yellow_cards, red_cards,
        players(id, name, jersey_number, position)
      `)
      .eq('match_id', m.id)

    if (error || !data) return

    const normalise = (p: Record<string, unknown>): Player & { _slot: number | null } => {
      const pl = Array.isArray(p.players) ? p.players[0] : (p.players as Record<string, unknown>)
      return {
        id:            pl?.id as string,
        name:          pl?.name as string,
        jersey_number: pl?.jersey_number as number | undefined,
        position:      pl?.position as string | undefined,
        team_id:       p.team_id as string,
        goals:         p.goals         as number | undefined,
        assists:       p.assists       as number | undefined,
        yellow_cards:  p.yellow_cards  as number | undefined,
        red_cards:     p.red_cards     as number | undefined,
        _slot:         (p.formation_slot as number | null) ?? null,
      }
    }

    /** Sort by formation_slot when available, unassigned players go to end */
    const sortBySlot = (arr: (Player & { _slot: number | null })[]) =>
      [...arr].sort((a, b) => {
        if (a._slot != null && b._slot != null) return a._slot - b._slot
        if (a._slot != null) return -1
        if (b._slot != null) return 1
        return 0
      })

    const homeId = m.home_team.id
    const awayId = m.away_team.id

    setHomeLineup(sortBySlot(data.filter((p) => p.team_id === homeId &&  p.is_starting && p.players).map(normalise)))
    setAwayLineup(sortBySlot(data.filter((p) => p.team_id === awayId &&  p.is_starting && p.players).map(normalise)))
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

  const isFriendly    = match.match_type === 'friendly'
  const active        = isActiveMatch(match.status)
  const hasLineups    = homeLineup.length > 0 || awayLineup.length > 0
  const hasBench      = homeBench.length > 0 || awayBench.length > 0

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link href="/matches" className={styles.back}>← Back to Matches</Link>

        {/* ── Match header ── */}
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

        {/* ── Tab bar ── */}
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

            {/* ── Formation tab ── */}
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

                {/* Bench under formation */}
                {hasBench && (
                  <div className={styles.benchSection}>
                    <div className={styles.benchSectionTitle}>Substitutes</div>
                    <div className={styles.benchGrid}>
                      <BenchColumn
                        teamName={match.home_team.name}
                        players={homeBench}
                        isHome={true}
                      />
                      <BenchColumn
                        teamName={match.away_team.name}
                        players={awayBench}
                        isHome={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Teams tab ── */}
            {activeTab === 'teams' && (
              <div className={styles.section}>
                <div className={styles.squadGrid}>
                  {/* Away team — left column */}
                  <SquadColumn
                    team={match.away_team}
                    starters={awayLineup}
                    bench={awayBench}
                    isHome={false}
                    formation={match.away_formation}
                  />

                  {/* Home team — right column */}
                  <SquadColumn
                    team={match.home_team}
                    starters={homeLineup}
                    bench={homeBench}
                    isHome={true}
                    formation={match.home_formation}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Bench column component ──────────────────────────────────────────────────

function BenchColumn({
  teamName,
  players,
  isHome,
}: {
  teamName: string
  players:  Player[]
  isHome:   boolean
}) {
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
            <PlayerStatIcons player={p} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Squad column component (Teams tab) ──────────────────────────────────────

function SquadColumn({
  team,
  starters,
  bench,
  isHome,
  formation,
}: {
  team:       Team
  starters:   Player[]
  bench:      Player[]
  isHome:     boolean
  formation?: string
}) {
  return (
    <div className={`${styles.squadColumn} ${isHome ? styles.squadHome : styles.squadAway}`}>
      {/* Team header */}
      <div className={styles.squadHeader}>
        <TeamLogo src={team.logo_url} alt={team.name} size={32} />
        <div>
          <div className={styles.squadTeamName}>{team.name}</div>
          {formation && <div className={styles.squadFormation}>{formation}</div>}
        </div>
      </div>

      {/* Starters */}
      {starters.length > 0 && (
        <div className={styles.squadSection}>
          <div className={styles.squadSectionLabel}>Starting XI</div>
          {starters.map((p) => (
            <SquadPlayerRow key={p.id} player={p} isHome={isHome} />
          ))}
        </div>
      )}

      {/* Bench */}
      {bench.length > 0 && (
        <div className={styles.squadSection}>
          <div className={styles.squadSectionLabel}>Substitutes</div>
          {bench.map((p) => (
            <SquadPlayerRow key={p.id} player={p} isHome={isHome} />
          ))}
        </div>
      )}

      {/* Coach */}
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

// ── Squad player row ────────────────────────────────────────────────────────

function SquadPlayerRow({ player, isHome }: { player: Player; isHome: boolean }) {
  const pos = positionShort(player.position)
  const posColor = positionGroupColor(player.position)

  return (
    <div className={styles.squadPlayer}>
      <span className={`${styles.jerseyBadge} ${isHome ? styles.homeBadge : styles.awayBadge}`}>
        {player.jersey_number ?? '–'}
      </span>
      <div className={styles.squadPlayerInfo}>
        <span className={styles.squadPlayerName}>{player.name}</span>
        {pos && (
          <span className={styles.positionBadge} style={{ color: posColor, borderColor: `${posColor}44` }}>
            {pos}
          </span>
        )}
      </div>
      <PlayerStatIcons player={player} />
    </div>
  )
}

// ── Shared stat icons ───────────────────────────────────────────────────────

function PlayerStatIcons({ player }: { player: Player }) {
  const hasGoals   = (player.goals ?? 0) > 0
  const hasAssists = (player.assists ?? 0) > 0
  const hasYellow  = (player.yellow_cards ?? 0) > 0
  const hasRed     = (player.red_cards ?? 0) > 0

  if (!hasGoals && !hasAssists && !hasYellow && !hasRed) return null

  return (
    <span className={styles.statIcons}>
      {hasGoals && <span>⚽{(player.goals ?? 0) > 1 ? player.goals : ''}</span>}
      {hasAssists && <span className={styles.assistLabel}>A{(player.assists ?? 0) > 1 ? player.assists : ''}</span>}
      {hasYellow && <YellowCard size={14} />}
      {hasRed && <RedCard size={14} />}
    </span>
  )
}
