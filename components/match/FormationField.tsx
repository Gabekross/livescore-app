'use client'

import styles from '@/styles/components/FormationField.module.scss'
import { formationLayouts } from './FormationLayout'

interface Player {
  id: string
  name: string
  jersey_number?: number
  team_id: string
  goals?: number
  assists?: number
  yellow_cards?: number
  red_cards?: number
}

interface TeamFormation {
  name: string
  logo?: string
  formation: string
  players: Player[]
}

interface Props {
  home: TeamFormation
  away: TeamFormation
}

const getDensityClass = (playerCount: number): string => {
  if (playerCount >= 11) return styles.dense
  if (playerCount >= 8) return styles.medium
  return styles.spacious
}

export default function CombinedFormationField({ home, away }: Props) {
  const renderPlayers = (team: TeamFormation, isHome: boolean) => {
    const layout = formationLayouts[team.formation || '4-3-3'] || []
    const densityClass = getDensityClass(team.players.length)

    return team.players.map((player, index) => {
      const pos = layout[index] || { x: '50%', y: '50%' }
      const baseY = parseFloat(pos.y)
      const x = pos.x

      let y: string
      let yValue: number

      if (isHome) {
        const pushedY = 5 + (baseY / 100) * 43
        yValue = index === 0 ? 5 + (baseY / 100) * 43 : pushedY + 6
        y = `${yValue.toFixed(2)}%`
      } else {
        const flippedY = 100 - baseY
        const pushedY = 52 + (flippedY / 100) * 43
        yValue = index === 0 ? 52 + (flippedY / 100) * 43 : pushedY - 6
        y = `${yValue.toFixed(2)}%`
      }

      return (
        <div
          key={player.id}
          className={`${styles.playerDot} ${isHome ? styles.homeDot : styles.awayDot} ${densityClass}`}
          style={{ left: x, top: y }}
        >
          {/* Stat Icons */}
          <div className={styles.statsTopLeft}>
            {player.yellow_cards ? `🟨${player.yellow_cards}` : ''}
            {player.red_cards ? `🟥${player.red_cards}` : ''}
          </div>
          <div className={styles.statsTopRight}>
            {player.goals ? `⚽${player.goals}` : ''}
            {player.assists ? `🎯${player.assists}` : ''}
          </div>

          {/* Player Number */}
          <div className={styles.playerNumber}>{player.jersey_number ?? ''}</div>

          {/* Player Name */}
          <div className={styles.playerNameBelow}>{player.name.split(' ')[0]}</div>
        </div>
      )
    })
  }

  return (
    <div className={styles.fieldContainer}>
      <div className={styles.teamLabelTop}>{away.name}</div>
      <div className={styles.teamLabelBottom}>{home.name}</div>
      <div
        className={`${styles.field} ${getDensityClass(home.players.length)} ${getDensityClass(away.players.length)}`}
      >
        {renderPlayers(away, false)}
        {renderPlayers(home, true)}
      </div>
    </div>
  )
}
