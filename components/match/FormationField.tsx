'use client'

import styles from '@/styles/components/FormationField.module.scss'
import { simplePositionLayouts } from './FormationLayout'

interface Player {
  id: string
  name: string
  jersey_number?: number
  team_id: string
  position?: 'GK' | 'DEF' | 'MID' | 'FWD'
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
    const layout = simplePositionLayouts[team.formation || '4-3-3'] || simplePositionLayouts['4-3-3']
    const grouped: { [key: string]: Player[] } = {
      GK: [], DEF: [], MID: [], FWD: []
    }

    team.players.forEach(p => {
      const role = p.position || 'FWD'
      grouped[role].push(p)
    })

    const positionedPlayers = Object.entries(grouped).flatMap(([role, players]) => {
      const slots = layout[role] || []
      return players.map((player, i) => {
        const base = slots[i] || { x: '50%', y: '50%' }
        const baseY = parseFloat(base.y)
        let y: string

        if (isHome) {
          y = `${(5 + (baseY / 100) * 43).toFixed(2)}%`
        } else {
          const flippedY = 100 - baseY
          y = `${(52 + (flippedY / 100) * 43).toFixed(2)}%`
        }

        return {
          ...player,
          x: base.x,
          y,
        }
      })
    })

    return positionedPlayers.map(player => (
      <div
        key={player.id}
        className={`${styles.playerDot} ${isHome ? styles.homeDot : styles.awayDot}`}
        style={{ left: player.x, top: player.y }}
      >
        <div className={styles.playerNumber}>{player.jersey_number ?? ''}</div>
        <div className={styles.playerNameBelow}>{player.name.split(' ')[0]}</div>
        <div className={styles.iconsTopRight}>
          {player.goals ? `⚽ ${player.goals}` : ''}
        </div>
        <div className={styles.iconsTopLeft}>
          {player.yellow_cards ? `🟨${player.yellow_cards} ` : ''}
          {player.red_cards ? `🟥${player.red_cards}` : ''}
        </div>
      </div>
    ))
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
