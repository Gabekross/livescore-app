'use client'

// Admin formation editor — two-team formation assignment on a split pitch.
// Home team (bottom half, blue), Away team (top half, red).
// Each slot shows the expected position label and a player dropdown.

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter }              from 'next/navigation'
import { supabase }                          from '@/lib/supabase'
import { getFormationSlots, FORMATION_NAMES } from '@/lib/constants/formations'
import { positionShort }                     from '@/lib/constants/positions'
import toast                                 from 'react-hot-toast'
import styles                                from '@/styles/components/FormationEditor.module.scss'

interface Player {
  id:              string
  name:            string
  jersey_number?:  number
  position?:       string
  team_id:         string
}

interface MatchData {
  home_team_id:    string
  away_team_id:    string
  home_formation:  string | null
  away_formation:  string | null
  home_team:       { name: string }
  away_team:       { name: string }
}

type Assignments = Record<string, string>  // "home-0" | "away-3" → playerId

export default function FormationEditorPage() {
  const { matchId }    = useParams()
  const router         = useRouter()

  const [matchData,       setMatchData]       = useState<MatchData | null>(null)
  const [homeFormation,   setHomeFormation]    = useState('4-3-3')
  const [awayFormation,   setAwayFormation]    = useState('4-3-3')
  const [homePlayers,     setHomePlayers]      = useState<Player[]>([])
  const [awayPlayers,     setAwayPlayers]      = useState<Player[]>([])
  const [assignments,     setAssignments]      = useState<Assignments>({})
  const [saving,          setSaving]           = useState(false)

  // ── Fetch data ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!matchId || typeof matchId !== 'string') return

    // 1. Match info
    const { data: match } = await supabase
      .from('matches')
      .select(`
        home_team_id, away_team_id, home_formation, away_formation,
        home_team:home_team_id(name),
        away_team:away_team_id(name)
      `)
      .eq('id', matchId)
      .single()

    if (!match) return

    const md: MatchData = {
      home_team_id:   match.home_team_id,
      away_team_id:   match.away_team_id,
      home_formation: match.home_formation,
      away_formation: match.away_formation,
      home_team:      Array.isArray(match.home_team) ? match.home_team[0] : match.home_team,
      away_team:      Array.isArray(match.away_team) ? match.away_team[0] : match.away_team,
    }
    setMatchData(md)
    if (md.home_formation) setHomeFormation(md.home_formation)
    if (md.away_formation) setAwayFormation(md.away_formation)

    // 2. Lineups
    const { data: lineups } = await supabase
      .from('match_lineups')
      .select('player_id, team_id, formation_slot, is_starting, players(id, name, jersey_number, position)')
      .eq('match_id', matchId)
      .eq('is_starting', true)

    if (!lineups) return

    const toPlayer = (row: any): Player => ({
      id:            row.players.id,
      name:          row.players.name,
      jersey_number: row.players.jersey_number,
      position:      row.players.position,
      team_id:       row.team_id,
    })

    const home = lineups.filter((r: any) => r.team_id === md.home_team_id && r.players).map(toPlayer)
    const away = lineups.filter((r: any) => r.team_id === md.away_team_id && r.players).map(toPlayer)
    setHomePlayers(home)
    setAwayPlayers(away)

    // Pre-fill assignments
    const prefill: Assignments = {}
    lineups.forEach((row: any) => {
      if (row.formation_slot != null && row.players) {
        const side = row.team_id === md.home_team_id ? 'home' : 'away'
        prefill[`${side}-${row.formation_slot}`] = row.players.id
      }
    })
    setAssignments(prefill)
  }, [matchId])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Handlers ────────────────────────────────────────────────────────
  const handleAssign = (key: string, playerId: string) => {
    setAssignments(prev => ({ ...prev, [key]: playerId }))
  }

  const handleSave = async () => {
    if (!matchId) return
    setSaving(true)

    try {
      // Save formations on the match
      await supabase
        .from('matches')
        .update({ home_formation: homeFormation, away_formation: awayFormation })
        .eq('id', matchId)

      // Save slot assignments
      for (const [key, playerId] of Object.entries(assignments)) {
        if (!playerId) continue
        const slot = parseInt(key.split('-')[1], 10)
        await supabase
          .from('match_lineups')
          .update({ formation_slot: slot })
          .eq('match_id', matchId)
          .eq('player_id', playerId)
      }

      toast.success('Formation saved')
      router.back()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ── Pitch coordinate mapping ────────────────────────────────────────
  function mapToHalf(slotX: number, slotY: number, isHome: boolean) {
    const normY = Math.min(slotY / 72, 1)
    const y = isHome ? 96 - normY * 42 : 4 + normY * 42
    return { x: `${slotX}%`, y: `${y.toFixed(1)}%` }
  }

  // ── Render ──────────────────────────────────────────────────────────
  if (!matchData) {
    return <div className={styles.editorContainer}><p style={{ color: '#6b7280' }}>Loading…</p></div>
  }

  const homeSlots = getFormationSlots(homeFormation)
  const awaySlots = getFormationSlots(awayFormation)

  // Build list of already-assigned player IDs per team to mark in dropdowns
  const homeAssigned = new Set(
    Object.entries(assignments)
      .filter(([k]) => k.startsWith('home-'))
      .map(([, v]) => v)
      .filter(Boolean)
  )
  const awayAssigned = new Set(
    Object.entries(assignments)
      .filter(([k]) => k.startsWith('away-'))
      .map(([, v]) => v)
      .filter(Boolean)
  )

  return (
    <div className={styles.editorContainer}>
      <button type="button" onClick={() => router.back()} className={styles.backButton}>
        &#8592; Back to Match
      </button>

      <h1 className={styles.heading}>Formation Editor</h1>
      <p className={styles.subheading}>
        Assign players to formation positions for both teams. Select a formation and drag players into slots.
      </p>

      {/* Formation selectors — side by side */}
      <div className={styles.formationSelectors}>
        <div className={styles.formationSelect}>
          <label className={styles.label}>
            <span className={styles.teamDot + ' ' + styles.teamDotAway} />
            {matchData.away_team.name}
          </label>
          <select value={awayFormation} onChange={e => setAwayFormation(e.target.value)}>
            {FORMATION_NAMES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className={styles.formationSelect}>
          <label className={styles.label}>
            <span className={styles.teamDot + ' ' + styles.teamDotHome} />
            {matchData.home_team.name}
          </label>
          <select value={homeFormation} onChange={e => setHomeFormation(e.target.value)}>
            {FORMATION_NAMES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Pitch with both teams */}
      <div className={styles.gridField}>
        {/* Centre line */}
        <div className={styles.centreLine} />

        {/* Team labels */}
        <div className={styles.pitchLabelTop}>{matchData.away_team.name} ({awayFormation})</div>
        <div className={styles.pitchLabelBottom}>{matchData.home_team.name} ({homeFormation})</div>

        {/* Away team — top half */}
        {awaySlots.map((slot, index) => {
          const { x, y } = mapToHalf(slot.x, slot.y, false)
          const key = `away-${index}`
          const posLabel = positionShort(slot.position)
          return (
            <div key={key} className={`${styles.slot} ${styles.slotAway}`} style={{ left: x, top: y }}>
              <div className={`${styles.slotLabel} ${styles.slotLabelAway}`}>{posLabel}</div>
              <select value={assignments[key] || ''} onChange={e => handleAssign(key, e.target.value)}>
                <option value="">-- {posLabel} --</option>
                {awayPlayers.map(p => (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={awayAssigned.has(p.id) && assignments[key] !== p.id}
                  >
                    #{p.jersey_number ?? '?'} {p.name}
                    {p.position ? ` (${positionShort(p.position)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )
        })}

        {/* Home team — bottom half */}
        {homeSlots.map((slot, index) => {
          const { x, y } = mapToHalf(slot.x, slot.y, true)
          const key = `home-${index}`
          const posLabel = positionShort(slot.position)
          return (
            <div key={key} className={`${styles.slot} ${styles.slotHome}`} style={{ left: x, top: y }}>
              <div className={`${styles.slotLabel} ${styles.slotLabelHome}`}>{posLabel}</div>
              <select value={assignments[key] || ''} onChange={e => handleAssign(key, e.target.value)}>
                <option value="">-- {posLabel} --</option>
                {homePlayers.map(p => (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={homeAssigned.has(p.id) && assignments[key] !== p.id}
                  >
                    #{p.jersey_number ?? '?'} {p.name}
                    {p.position ? ` (${positionShort(p.position)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      <button onClick={handleSave} disabled={saving} className={styles.saveButton}>
        {saving ? 'Saving…' : 'Save Formations'}
      </button>
    </div>
  )
}
