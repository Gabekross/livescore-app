'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAdminOrg }     from '@/contexts/AdminOrgContext'
import { useAdminOrgGate } from '@/components/admin/AdminOrgGate'
import toast from 'react-hot-toast'
import styles from '@/styles/components/TeamForm.module.scss'
import { v4 as uuidv4 } from 'uuid'
import * as XLSX from 'xlsx'
import { POSITIONS } from '@/lib/constants/positions'

interface PlayerInput {
  id?:            string   // existing player UUID — undefined for new players
  name:           string
  jersey_number?: number
  position?:      string
  _deleted?:      boolean  // soft-mark for removal
}

export default function EditTeamPage() {
  const { id } = useParams()
  const router = useRouter()
  const { orgId } = useAdminOrg()
  const orgGate = useAdminOrgGate()

  const [name, setName] = useState('')
  const [coachName, setCoachName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [players, setPlayers] = useState<PlayerInput[]>([])
  const [originalPlayerIds, setOriginalPlayerIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchTeam = async () => {
      if (!id || typeof id !== 'string' || !orgId) return

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .eq('organization_id', orgId)
        .single()
      if (error) {
        toast.error('Team not found')
        return
      }

      setName(data.name)
      setCoachName(data.coach_name || '')
      setLogoUrl(data.logo_url || '')
      fetchPlayers(data.id)
    }

    fetchTeam()
  }, [id, orgId])

  if (orgGate) return orgGate

  const fetchPlayers = async (teamId: string) => {
    const { data, error } = await supabase
      .from('players')
      .select('id, name, jersey_number, position')
      .eq('team_id', teamId)
    if (!error && data) {
      setPlayers(data)
      setOriginalPlayerIds(new Set(data.map(p => p.id)))
    }
  }

  const handleAddPlayer = () => {
    setPlayers([...players, { name: '' }])
  }

  const handleRemovePlayer = (index: number) => {
    setPlayers((prev) => {
      const player = prev[index]
      // If this player has a DB id, we need to track it for deletion
      if (player.id) {
        // Mark for deletion instead of removing from array,
        // so we know which DB rows to delete
        const updated = [...prev]
        updated[index] = { ...player, _deleted: true }
        return updated
      }
      // New player (no DB id) — just remove from array
      return prev.filter((_, i) => i !== index)
    })
  }

  const handlePlayerChange = (index: number, key: keyof PlayerInput, value: any) => {
    setPlayers((prev) => {
      const updated = [...prev]
      if (!updated[index]) return prev
      updated[index] = { ...updated[index], [key]: value }
      return updated
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    toast('Spreadsheet import will replace the current roster. Existing players with match data will be preserved if names match.', { duration: 5000 })

    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const data: any[] = XLSX.utils.sheet_to_json(sheet)
      const parsedPlayers: PlayerInput[] = data.map((row) => ({
        name: String(row.name || row.Name || ''),
        jersey_number: Number(row.jersey_number || row.Number || 0) || undefined,
        position: String(row.position || row.Position || ''),
      }))

      // Try to match imported players to existing ones by name to preserve IDs
      const existingByName = new Map<string, PlayerInput>()
      players.filter(p => p.id && !p._deleted).forEach(p => {
        existingByName.set(p.name.toLowerCase().trim(), p)
      })

      const merged = parsedPlayers.map(imported => {
        const match = existingByName.get(imported.name.toLowerCase().trim())
        if (match) {
          existingByName.delete(imported.name.toLowerCase().trim())
          return { ...match, ...imported, id: match.id }
        }
        return imported
      })

      // Mark unmatched existing players as deleted
      const deletedExisting: PlayerInput[] = []
      for (const remaining of existingByName.values()) {
        deletedExisting.push({ ...remaining, _deleted: true })
      }

      setPlayers([...merged, ...deletedExisting])
    }
    reader.readAsBinaryString(file)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Team name is required')
      return
    }

    setLoading(true)
    let uploadedLogoUrl = logoUrl

    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('team-logos')
        .upload(fileName, logoFile)

      if (uploadError) {
        toast.error('Failed to upload logo')
        setLoading(false)
        return
      }

      const { data } = supabase.storage
        .from('team-logos')
        .getPublicUrl(fileName)

      uploadedLogoUrl = data.publicUrl
    }

    // 1. Update team info
    const { error: updateError } = await supabase.from('teams')
      .update({ name, logo_url: uploadedLogoUrl || null, coach_name: coachName.trim() || null })
      .eq('id', id)

    if (updateError) {
      toast.error('Update failed')
      setLoading(false)
      return
    }

    // 2. Handle players — update existing, insert new, delete removed
    const toUpdate: PlayerInput[] = []
    const toInsert: PlayerInput[] = []
    const toDelete: string[] = []

    for (const player of players) {
      if (!player.name?.trim()) continue

      if (player._deleted && player.id) {
        toDelete.push(player.id)
      } else if (player.id && originalPlayerIds.has(player.id)) {
        toUpdate.push(player)
      } else if (!player.id) {
        toInsert.push(player)
      }
    }

    // Also delete any original players that aren't in the current list at all
    // (shouldn't happen with soft-delete, but safety net)
    const currentIds = new Set(players.filter(p => p.id && !p._deleted).map(p => p.id!))
    for (const origId of originalPlayerIds) {
      if (!currentIds.has(origId) && !toDelete.includes(origId)) {
        toDelete.push(origId)
      }
    }

    // Delete removed players
    if (toDelete.length) {
      const { error } = await supabase
        .from('players')
        .delete()
        .in('id', toDelete)
      if (error) {
        toast.error(`Failed to remove ${toDelete.length} player(s)`)
      }
    }

    // Update existing players
    for (const player of toUpdate) {
      await supabase
        .from('players')
        .update({
          name:          player.name.trim(),
          jersey_number: player.jersey_number ?? null,
          position:      player.position || null,
        })
        .eq('id', player.id!)
    }

    // Insert new players
    if (toInsert.length) {
      const rows = toInsert.map(p => ({
        team_id:       id,
        name:          p.name.trim(),
        jersey_number: p.jersey_number ?? null,
        position:      p.position || null,
      }))
      const { error: playerError } = await supabase.from('players').insert(rows)
      if (playerError) toast.error('Some new players failed to save')
    }

    toast.success('Team updated!')
    setTimeout(() => router.push('/admin/teams'), 800)
    setLoading(false)
  }

  // Filter out soft-deleted players for display
  const visiblePlayers = players.filter(p => !p._deleted)

  return (
    <div className={styles.formContainer}>
      <Link href="/admin/teams" className={styles.backButton}>
        &#8592; Back to Teams
      </Link>

      <h1 className={styles.heading}>Edit Team</h1>

      <form onSubmit={handleUpdate} className={styles.form}>
        <div className={styles.section}>
          <h3 className={styles.subheading}>Team Info</h3>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Team Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Upload Logo <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 400 }}>(optional — replaces current)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setLogoFile(e.target.files[0])
                }
              }}
              className={styles.input}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Head Coach <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
              className={styles.input}
              placeholder="e.g. José Mourinho"
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.subheading}>Players</h3>
          <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '1rem' }}>
            Edit players or import a new roster from a spreadsheet.
          </p>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Import from Spreadsheet</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className={styles.input}
            />
          </div>

          <button type="button" onClick={handleAddPlayer} className={styles.secondaryButton}>+ Add Player</button>

          {visiblePlayers.map((player, idx) => {
            // Map visible index back to actual array index
            const realIdx = players.indexOf(player)
            return (
              <div key={player.id || `new-${idx}`} className={styles.playerRow}>
                <input
                  type="text"
                  placeholder="Player Name"
                  value={player.name}
                  onChange={(e) => handlePlayerChange(realIdx, 'name', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="#"
                  value={player.jersey_number || ''}
                  onChange={(e) => handlePlayerChange(realIdx, 'jersey_number', Number(e.target.value))}
                  style={{ maxWidth: '64px' }}
                />
                <select
                  value={player.position || ''}
                  onChange={(e) => handlePlayerChange(realIdx, 'position', e.target.value)}
                  style={{ minWidth: '100px' }}
                >
                  <option value="">Position</option>
                  {POSITIONS.map((pos) => (
                    <option key={pos.value} value={pos.value}>{pos.short} – {pos.label}</option>
                  ))}
                </select>
                <button type="button" onClick={() => handleRemovePlayer(realIdx)} className={styles.secondaryButton} style={{ padding: '4px 8px', marginTop: 0, fontSize: '0.78rem' }}>
                  Remove
                </button>
              </div>
            )
          })}
        </div>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Updating...' : 'Update Team'}
        </button>
      </form>
    </div>
  )
}
