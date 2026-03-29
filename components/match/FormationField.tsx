'use client'

// components/match/FormationField.tsx
// Professional two-team pitch display.
// Home team renders on the bottom half, away team on the top half.
// Each player dot shows jersey number, first name, and stat event icons.

import { getFormationSlots } from '@/lib/constants/formations'
import { positionShort }     from '@/lib/constants/positions'
import { YellowCard, RedCard } from '@/components/ui/CardIcon'
import styles from '@/styles/components/FormationField.module.scss'

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

interface TeamFormation {
  name:      string
  logo?:     string
  formation: string
  players:   Player[]
}

interface Props {
  home: TeamFormation
  away: TeamFormation
}

/**
 * Map a formation slot's raw coordinates (0-100) into the team's half of the pitch.
 * Home team: bottom half (y: 52% → 96%)
 * Away team: top half, flipped (y: 4% → 48%)
 */
function mapToHalf(
  slotX: number,
  slotY: number,
  isHome: boolean
): { x: string; y: string } {
  // slotY goes from 0 (own goal) to ~70 (forward line)
  // Normalise to 0..1 range based on max expected y
  const normY = Math.min(slotY / 72, 1)

  let y: number
  if (isHome) {
    // Bottom half: GK near 96%, forwards near 54%
    y = 96 - normY * 42
  } else {
    // Top half: GK near 4%, forwards near 46%
    y = 4 + normY * 42
  }

  return {
    x: `${slotX}%`,
    y: `${y.toFixed(1)}%`,
  }
}

function PlayerDot({
  player,
  slotX,
  slotY,
  isHome,
}: {
  player: Player
  slotX: number
  slotY: number
  isHome: boolean
}) {
  const { x, y } = mapToHalf(slotX, slotY, isHome)
  const firstName = player.name.split(' ')[0]
  const hasGoals   = (player.goals ?? 0) > 0
  const hasAssists = (player.assists ?? 0) > 0
  const hasYellow  = (player.yellow_cards ?? 0) > 0
  const hasRed     = (player.red_cards ?? 0) > 0
  const hasEvents  = hasGoals || hasAssists || hasYellow || hasRed

  return (
    <div
      className={`${styles.dot} ${isHome ? styles.dotHome : styles.dotAway}`}
      style={{ left: x, top: y }}
    >
      {/* Event icons row */}
      {hasEvents && (
        <div className={styles.eventRow}>
          {hasGoals && (
            <span className={styles.eventChip}>
              <span className={styles.goalIcon}>⚽</span>
              {(player.goals ?? 0) > 1 && <span>{player.goals}</span>}
            </span>
          )}
          {hasAssists && (
            <span className={styles.eventChip}>
              <span className={styles.assistIcon}>A</span>
              {(player.assists ?? 0) > 1 && <span>{player.assists}</span>}
            </span>
          )}
          {hasYellow && (
            <span className={styles.eventChip}>
              <YellowCard size={10} />
            </span>
          )}
          {hasRed && (
            <span className={styles.eventChip}>
              <RedCard size={10} />
            </span>
          )}
        </div>
      )}

      {/* Jersey number circle */}
      <div className={styles.jersey}>
        {player.jersey_number ?? '–'}
      </div>

      {/* Player name */}
      <div className={styles.playerName}>{firstName}</div>
    </div>
  )
}

export default function CombinedFormationField({ home, away }: Props) {
  const homeSlots = getFormationSlots(home.formation || '4-3-3')
  const awaySlots = getFormationSlots(away.formation || '4-3-3')

  return (
    <div className={styles.pitchWrapper}>
      {/* Team labels */}
      <div className={styles.teamLabelTop}>
        <span className={styles.teamLabelDot + ' ' + styles.teamLabelDotAway} />
        {away.name}
        {away.formation && <span className={styles.formationTag}>{away.formation}</span>}
      </div>

      {/* Pitch */}
      <div className={styles.pitch}>
        {/* Centre line indicator */}
        <div className={styles.centreLine} />

        {/* Away team — top half */}
        {away.players.map((player, i) => {
          const slot = awaySlots[i]
          if (!slot) return null
          return (
            <PlayerDot
              key={player.id}
              player={player}
              slotX={slot.x}
              slotY={slot.y}
              isHome={false}
            />
          )
        })}

        {/* Home team — bottom half */}
        {home.players.map((player, i) => {
          const slot = homeSlots[i]
          if (!slot) return null
          return (
            <PlayerDot
              key={player.id}
              player={player}
              slotX={slot.x}
              slotY={slot.y}
              isHome={true}
            />
          )
        })}
      </div>

      <div className={styles.teamLabelBottom}>
        <span className={styles.teamLabelDot + ' ' + styles.teamLabelDotHome} />
        {home.name}
        {home.formation && <span className={styles.formationTag}>{home.formation}</span>}
      </div>
    </div>
  )
}
