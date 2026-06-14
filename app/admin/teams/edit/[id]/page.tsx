'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAdminOrg }     from '@/contexts/AdminOrgContext'
import { useAdminOrgGate } from '@/components/admin/AdminOrgGate'
import { uploadTeamLogo } from '@/lib/team-logo-upload-client'
import toast from 'react-hot-toast'
import styles from '@/styles/components/TeamForm.module.scss'
import { POSITIONS } from '@/lib/constants/positions'

interface PlayerInput {
  id?:            string
  first_name:     string
  last_name?:     string
  phone_number?:  string
  jersey_number?: number
  position?:      string
  _deleted?:      boolean
}

function buildName(p: PlayerInput): string {
  return [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const HEADER_ALIASES: Record<string, string> = {
  firstname: 'first_name', first: 'first_name', fname: 'first_name',
  lastname: 'last_name', last: 'last_name', lname: 'last_name', surname: 'last_name',
  jerseynumber: 'jersey_number', jersey: 'jersey_number', number: 'jersey_number', '#': 'jersey_number',
  position: 'position', pos: 'position',
  phonenumber: 'phone_number', phone: 'phone_number', mobile: 'phone_number', tel: 'phone_number',
  name: 'name', playername: 'name',
  dateofbirth: 'date_of_birth', dob: 'date_of_birth',
  nationality: 'nationality', country: 'nationality',
  photourl: 'photo_url', photo: 'photo_url',
}

function resolveColumn(raw: string): string | null {
  const key = normalizeHeader(raw)
  return HEADER_ALIASES[key] ?? null
}

function parseSpreadsheetRow(row: Record<string, unknown>): PlayerInput {
  const mapped: Record<string, string> = {}
  for (const [rawKey, val] of Object.entries(row)) {
    const col = resolveColumn(rawKey)
    if (col && val != null && String(val).trim()) mapped[col] = String(val).trim()
  }

  let firstName = mapped['first_name'] || ''
  let lastName  = mapped['last_name']  || ''

  if (!firstName && mapped['name']) {
    const parts = mapped['name'].trim().split(/\s+/)
    firstName = parts[0] || ''
    lastName  = parts.slice(1).join(' ')
  }

  const jn = mapped['jersey_number'] ? Number(mapped['jersey_number']) : undefined

  return {
    first_name:    firstName,
    last_name:     lastName || undefined,
    phone_number:  mapped['phone_number'] || undefined,
    jersey_number: jn && !isNaN(jn) ? jn : undefined,
    position:      mapped['position'] || undefined,
  }
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
  const [showOnPublicPage, setShowOnPublicPage] = useState(true)

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
      setShowOnPublicPage(data.show_on_public_teams_page ?? true)
      fetchPlayers(data.id)
    }

    fetchTeam()
  }, [id, orgId])

  if (orgGate) return orgGate

  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importStats,  setImportStats]  = useState<{ valid: number; invalid: number } | null>(null)

  const fetchPlayers = async (teamId: string) => {
    const { data, error } = await supabase
      .from('players')
      .select('id, first_name, last_name, name, phone_number, jersey_number, position')
      .eq('team_id', teamId)
    if (!error && data) {
      const mapped = data.map((p: any) => ({
        id:           p.id,
        first_name:   p.first_name || p.name?.split(' ')[0] || '',
        last_name:    p.last_name || (p.name?.split(' ').slice(1).join(' ')) || undefined,
        phone_number: p.phone_number || undefined,
        jersey_number: p.jersey_number ?? undefined,
        position:     p.position || undefined,
      }))
      setPlayers(mapped)
      setOriginalPlayerIds(new Set(data.map((p: any) => p.id)))
    }
  }

  const handleAddPlayer = () => {
    setPlayers([...players, { first_name: '' }])
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    toast('Spreadsheet import will replace the current roster. Existing players with match data will be preserved if names match.', { duration: 5000 })

    const XLSX = await import('xlsx')
    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const data: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet)
      const errors: string[] = []
      const parsedPlayers: PlayerInput[] = []

      data.forEach((row, i) => {
        const p = parseSpreadsheetRow(row)
        if (!p.first_name) {
          errors.push(`Row ${i + 2}: Missing first name`)
          return
        }
        parsedPlayers.push(p)
      })

      const seen = new Map<number, number>()
      parsedPlayers.forEach((p, i) => {
        if (p.jersey_number != null) {
          if (seen.has(p.jersey_number)) {
            errors.push(`Row ${i + 2}: Duplicate jersey #${p.jersey_number}`)
          }
          seen.set(p.jersey_number, i)
        }
      })

      setImportErrors(errors)
      setImportStats({ valid: parsedPlayers.length, invalid: data.length - parsedPlayers.length })

      const existingByName = new Map<string, PlayerInput>()
      players.filter(p => p.id && !p._deleted).forEach(p => {
        existingByName.set(buildName(p).toLowerCase(), p)
      })

      const merged = parsedPlayers.map(imported => {
        const importedFullName = buildName(imported).toLowerCase()
        const match = existingByName.get(importedFullName)
        if (match) {
          existingByName.delete(importedFullName)
          return { ...match, ...imported, id: match.id }
        }
        return imported
      })

      const deletedExisting: PlayerInput[] = []
      for (const remaining of existingByName.values()) {
        deletedExisting.push({ ...remaining, _deleted: true })
      }

      setPlayers([...merged, ...deletedExisting])
    }
    reader.readAsBinaryString(file)
  }

  const downloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/templates/player_import_template.xlsx'
    link.setAttribute('download', 'player_import_template.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      try {
        const uploaded = await uploadTeamLogo(logoFile, orgId)
        uploadedLogoUrl = uploaded.publicUrl || ''
        if (uploaded.fallback) {
          toast('Logo uploaded, but background cleanup was skipped.', { duration: 3500 })
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to upload logo')
        setLoading(false)
        return
      }
    }

    // 1. Update team info
    const { error: updateError } = await supabase.from('teams')
      .update({ name, logo_url: uploadedLogoUrl || null, coach_name: coachName.trim() || null, show_on_public_teams_page: showOnPublicPage })
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
      if (!player.first_name?.trim()) continue

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
          first_name:    player.first_name.trim(),
          last_name:     player.last_name?.trim() || null,
          name:          buildName(player),
          phone_number:  player.phone_number?.trim() || null,
          jersey_number: player.jersey_number ?? null,
          position:      player.position || null,
        })
        .eq('id', player.id!)
    }

    // Insert new players
    if (toInsert.length) {
      const rows = toInsert.map(p => ({
        team_id:       id,
        first_name:    p.first_name.trim(),
        last_name:     p.last_name?.trim() || null,
        name:          buildName(p),
        phone_number:  p.phone_number?.trim() || null,
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
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setLogoFile(e.target.files[0])
                }
              }}
              className={styles.input}
            />
            {logoUrl && !logoFile && (
              <div className={styles.logoPreviewRow}>
                <img src={logoUrl} alt={`${name} logo`} className={styles.logoPreview} />
                <span>Current logo</span>
              </div>
            )}
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

          <div className={styles.toggleRow}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={showOnPublicPage}
                onChange={(e) => setShowOnPublicPage(e.target.checked)}
                className={styles.toggleCheckbox}
              />
              <span className={styles.toggleText}>Show on public Teams page</span>
            </label>
            <p className={styles.toggleHint}>
              When unchecked this team is hidden from visitors but still works in fixtures, match pages, standings, and all admin areas.
            </p>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.subheading}>Players</h3>
          <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '1rem' }}>
            Edit players or import a new roster from a spreadsheet. Use the template columns: first_name, last_name, phone_number, jersey_number, position.
          </p>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Import from Spreadsheet</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className={styles.input}
                style={{ flex: 1 }}
              />
              <button type="button" onClick={downloadTemplate} className={styles.secondaryButton} style={{ marginTop: 0, whiteSpace: 'nowrap' }}>
                Download Template
              </button>
            </div>
            {importStats && (
              <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.5rem 0 0' }}>
                {importStats.valid} valid row{importStats.valid !== 1 ? 's' : ''}{importStats.invalid > 0 && <>, <span style={{ color: '#ef4444' }}>{importStats.invalid} invalid</span></>}
              </p>
            )}
            {importErrors.length > 0 && (
              <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.4rem', maxHeight: '6rem', overflow: 'auto' }}>
                {importErrors.map((err, i) => <div key={i}>{err}</div>)}
              </div>
            )}
          </div>

          <button type="button" onClick={handleAddPlayer} className={styles.secondaryButton}>+ Add Player</button>

          {visiblePlayers.map((player, idx) => {
            const realIdx = players.indexOf(player)
            return (
              <div key={player.id || `new-${idx}`} className={styles.playerRow}>
                <input
                  type="text"
                  placeholder="First Name *"
                  value={player.first_name}
                  onChange={(e) => handlePlayerChange(realIdx, 'first_name', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={player.last_name || ''}
                  onChange={(e) => handlePlayerChange(realIdx, 'last_name', e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={player.phone_number || ''}
                  onChange={(e) => handlePlayerChange(realIdx, 'phone_number', e.target.value)}
                  style={{ maxWidth: '140px' }}
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
