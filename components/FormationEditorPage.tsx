'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/FormationEditor.module.scss'
import { formationLayouts } from './match/FormationLayout'

interface Player {
  id: string
  name: string
  jersey_number?: number
  position?: string
  formation_slot?: number
}

export default function FormationEditorPage() {
  const { matchId } = useParams()
  const router = useRouter()

  const [formation, setFormation] = useState('4-3-3')
  const [players, setPlayers] = useState<Player[]>([])
  const [assignments, setAssignments] = useState<{ [slot: number]: string }>({})

  useEffect(() => {
    if (!matchId || typeof matchId !== 'string') return
    fetchMatchPlayers()
  }, [matchId])

  const fetchMatchPlayers = async () => {
    const { data } = await supabase
      .from('match_lineups')
      .select('id, player_id, formation_slot, players(id, name, jersey_number, position)')
      .eq('match_id', matchId)
      .eq('is_starting', true)

    if (data) {
      const formatted = data.map((entry: any) => ({
        id: entry.players.id,
        name: entry.players.name,
        jersey_number: entry.players.jersey_number,
        position: entry.players.position,
        formation_slot: entry.formation_slot ?? null,
      }))

      setPlayers(formatted)

      const prefill: { [slot: number]: string } = {}
      formatted.forEach(p => {
        if (p.formation_slot != null) prefill[p.formation_slot] = p.id
      })
      setAssignments(prefill)
    }
  }

  const handleAssign = (slot: number, playerId: string) => {
    setAssignments(prev => ({ ...prev, [slot]: playerId }))
  }

  const handleSave = async () => {
    const updates = Object.entries(assignments).map(([slot, playerId]) => ({
      match_id: matchId,
      player_id: playerId,
      formation_slot: Number(slot),
    }))

    for (const update of updates) {
      await supabase
        .from('match_lineups')
        .update({ formation_slot: update.formation_slot })
        .eq('match_id', matchId)
        .eq('player_id', update.player_id)
    }

    router.back() // Navigate to the previous page
  }

  const layout = formationLayouts[formation] || []

  // Determine density class based on layout length
  const densityClass =
    layout.length > 11 ? 'dense' : layout.length > 8 ? 'medium' : 'spacious'

  return (
    <div className={styles.editorContainer}>
      <h2>Formation Editor</h2>

      <select value={formation} onChange={e => setFormation(e.target.value)}>
        {Object.keys(formationLayouts).map(f => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      <div className={`${styles.gridField} ${styles[densityClass]}`}>
        {layout.map((pos, index) => (
          <div key={index} className={styles.slot} style={{ left: pos.x, top: pos.y }}>
            <select
              value={assignments[index] || ''}
              onChange={(e) => handleAssign(index, e.target.value)}
            >
              <option value=''>-- Select Player --</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.position?.toUpperCase() || 'POS'} - {p.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <button onClick={handleSave} className={styles.saveButton}>
        Save Formation
      </button>
    </div>
  )
}
