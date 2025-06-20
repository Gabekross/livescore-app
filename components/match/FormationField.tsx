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

export default function CombinedFormationField({ home, away }: Props) {
const renderPlayers = (team: TeamFormation, isHome: boolean) => {
  const layout = formationLayouts[team.formation || '4-3-3'] || []

  return team.players.map((player, index) => {
    const pos = layout[index] || { x: '50%', y: '50%' }
    const baseY = parseFloat(pos.y)
    const x = pos.x

    let y: string

    if (isHome) {
      // Home team - 5% to 48%
      if (index === 0) {
        // Keep goalkeeper at goal line
        y = `${(5 + (baseY / 100) * 43).toFixed(2)}%`
      } else {
        // Move field players closer to 48% (midline)
        const pushedY = 5 + (baseY / 100) * 43
        y = `${(pushedY + 6).toFixed(2)}%`
      }
    } else {
      // Away team - 52% to 95%
      const flippedY = 100 - baseY
      if (index === 0) {
        // Keep goalkeeper at goal line
        y = `${(52 + (flippedY / 100) * 43).toFixed(2)}%`
      } else {
        // Move field players closer to 52% (midline)
        const pushedY = 52 + (flippedY / 100) * 43
        y = `${(pushedY - 6).toFixed(2)}%`
      }
    }

    return (
      <div
        key={player.id}
        className={`${styles.playerDot} ${isHome ? styles.homeDot : styles.awayDot}`}
        style={{ left: x, top: y }}
      >
        <div className={styles.playerNumber}>{player.jersey_number ?? ''}</div>
        <div className={styles.playerNameBelow}>{player.name.split(' ')[0]}</div>
        <div className={styles.iconsBelow}>
          {player.goals ? `⚽ ${player.goals} ` : ''}
          {player.yellow_cards ? `🟨 ${player.yellow_cards} ` : ''}
          {player.red_cards ? `🟥 ${player.red_cards}` : ''}
        </div>
      </div>
    )
  })
}






  return (
    <div className={styles.fieldContainer}>
      <div className={styles.teamLabelTop}>{away.name}</div>
      <div className={styles.teamLabelBottom}>{home.name}</div>
      <div className={styles.field}>
        {renderPlayers(away, false)}
        {renderPlayers(home, true)}
      </div>
    </div>
  )
}
