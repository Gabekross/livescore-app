'use client'

import { useState }  from 'react'
import { useRouter } from 'next/navigation'
import Link          from 'next/link'
import { supabase }  from '@/lib/supabase'
import { useAdminOrg } from '@/contexts/AdminOrgContext'
import { useAdminOrgGate } from '@/components/admin/AdminOrgGate'
import { useTeamLimit } from '@/hooks/useTeamLimit'
import UpgradeModal  from '@/components/admin/UpgradeModal'
import toast         from 'react-hot-toast'
import styles        from '@/styles/components/TeamForm.module.scss'
import shared        from '@/styles/components/AdminShared.module.scss'
import { POSITIONS } from '@/lib/constants/positions'

interface PlayerInput {
  first_name:    string
  last_name?:    string
  phone_number?: string
  jersey_number?: number
  position?:     string
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

export default function CreateTeamPage() {
  const router = useRouter()
  const { orgId, loading: orgLoading } = useAdminOrg()
  const orgGate = useAdminOrgGate()
  const { canAddTeam, teamCount, teamLimit } = useTeamLimit()

  const [nameError,          setNameError]          = useState('')
  const [name,               setName]               = useState('')
  const [coachName,          setCoachName]          = useState('')
  const [logoUrl,            setLogoUrl]            = useState('')
  const [logoFile,           setLogoFile]           = useState<File | null>(null)
  const [players,            setPlayers]            = useState<PlayerInput[]>([])
  const [loading,            setLoading]            = useState(false)
  const [showOnPublicPage,   setShowOnPublicPage]   = useState(true)

  const handleAddPlayer = () => setPlayers([...players, { first_name: '' }])

  const handlePlayerChange = (index: number, key: keyof PlayerInput, value: string | number) => {
    setPlayers((prev) => {
      const updated = [...prev]
      if (!updated[index]) return prev
      updated[index] = { ...updated[index], [key]: value }
      return updated
    })
  }

  const handleRemovePlayer = (index: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index))
  }

  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importStats,  setImportStats]  = useState<{ valid: number; invalid: number } | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const XLSX = await import('xlsx')
    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target?.result
      const wb   = XLSX.read(bstr, { type: 'binary' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const data: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet)
      const errors: string[] = []
      const parsed: PlayerInput[] = []

      data.forEach((row, i) => {
        const p = parseSpreadsheetRow(row)
        if (!p.first_name) {
          errors.push(`Row ${i + 2}: Missing first name`)
          return
        }
        parsed.push(p)
      })

      const seen = new Map<number, number>()
      parsed.forEach((p, i) => {
        if (p.jersey_number != null) {
          if (seen.has(p.jersey_number)) {
            errors.push(`Row ${i + 2}: Duplicate jersey #${p.jersey_number}`)
          }
          seen.set(p.jersey_number, i)
        }
      })

      setImportErrors(errors)
      setImportStats({ valid: parsed.length, invalid: data.length - parsed.length })
      setPlayers(parsed)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setNameError('Team name is required')
      return
    }

    setLoading(true)

    let uploadedLogoUrl = logoUrl

    if (logoFile) {
      const fileExt  = logoFile.name.split('.').pop()
      const filePath = `${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('team-logos')
        .upload(filePath, logoFile, { cacheControl: '3600', upsert: true, contentType: logoFile.type || 'image/png' })

      if (uploadError) {
        toast.error('Failed to upload logo')
        setLoading(false)
        return
      }

      uploadedLogoUrl = supabase.storage.from('team-logos').getPublicUrl(filePath).data.publicUrl
    }

    const { data: teamData, error } = await supabase
      .from('teams')
      .insert({ name: name.trim(), logo_url: uploadedLogoUrl || null, coach_name: coachName.trim() || null, organization_id: orgId, show_on_public_teams_page: showOnPublicPage })
      .select()
      .single()

    if (error || !teamData) {
      toast.error(error?.message || 'Failed to create team')
      setLoading(false)
      return
    }

    const toInsert = players
      .filter((p) => p.first_name?.trim())
      .map((p) => ({
        team_id:       teamData.id,
        first_name:    p.first_name.trim(),
        last_name:     p.last_name?.trim() || null,
        name:          buildName(p),
        phone_number:  p.phone_number?.trim() || null,
        jersey_number: p.jersey_number ?? null,
        position:      p.position || null,
      }))

    if (toInsert.length) {
      const { error: playerError } = await supabase.from('players').insert(toInsert)
      if (playerError) toast.error('Some players failed to save')
    }

    toast.success('Team created successfully!')
    setTimeout(() => router.push('/admin/teams'), 800)
    setLoading(false)
  }

  if (orgGate) return orgGate

  if (!canAddTeam) {
    return (
      <>
        <div style={{ maxWidth: 520, margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏟️</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            You&apos;ve hit the {teamLimit}-team limit
          </h2>
          <p style={{ fontSize: '0.87rem', color: '#6b7280', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Your league is growing! Upgrade to Pro to add unlimited teams
            and unlock media, news publishing, and more.
          </p>
          <UpgradeModal
            open={true}
            onClose={() => window.history.back()}
            headline={`You've hit the ${teamLimit}-team limit`}
            subtext="Run leagues of any size without limits. Upgrade to Pro for unlimited teams, media, and match operators."
          />
          <div style={{ marginTop: '1rem' }}>
            <Link href="/admin/teams" style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              ← Back to Teams
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className={styles.formContainer}>
      <Link href="/admin/teams" className={styles.backButton}>
        &#8592; Back to Teams
      </Link>

      <h1 className={styles.heading}>Create New Team</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h3 className={styles.subheading}>Team Info</h3>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Team Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (e.target.value.trim()) setNameError('') }}
              onBlur={() => !name.trim() && setNameError('Team name is required')}
              className={`${styles.input} ${nameError ? shared.inputInvalid : ''}`}
              placeholder="e.g. FC United"
            />
            {nameError && <span className={shared.fieldError}>{nameError}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Upload Logo <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => { if (e.target.files?.[0]) setLogoFile(e.target.files[0]) }}
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
            Add players manually or import from a spreadsheet (.xlsx, .csv). Use the template columns: first_name, last_name, phone_number, jersey_number, position.
          </p>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Import from Spreadsheet</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className={styles.input} style={{ flex: 1 }} />
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

          {players.map((player, idx) => (
            <div key={idx} className={styles.playerRow}>
              <input
                type="text"
                placeholder="First Name *"
                value={player.first_name}
                onChange={(e) => handlePlayerChange(idx, 'first_name', e.target.value)}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={player.last_name || ''}
                onChange={(e) => handlePlayerChange(idx, 'last_name', e.target.value)}
              />
              <input
                type="tel"
                placeholder="Phone"
                value={player.phone_number || ''}
                onChange={(e) => handlePlayerChange(idx, 'phone_number', e.target.value)}
                style={{ maxWidth: '140px' }}
              />
              <input
                type="number"
                placeholder="#"
                value={player.jersey_number || ''}
                onChange={(e) => handlePlayerChange(idx, 'jersey_number', Number(e.target.value))}
                style={{ maxWidth: '64px' }}
              />
              <select
                value={player.position || ''}
                onChange={(e) => handlePlayerChange(idx, 'position', e.target.value)}
                style={{ minWidth: '100px' }}
              >
                <option value="">Position</option>
                {POSITIONS.map((pos) => (
                  <option key={pos.value} value={pos.value}>{pos.short} – {pos.label}</option>
                ))}
              </select>
              <button type="button" onClick={() => handleRemovePlayer(idx)} className={styles.secondaryButton} style={{ padding: '4px 8px', marginTop: 0, fontSize: '0.78rem' }}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading || orgLoading} className={styles.button}>
          {loading ? 'Creating...' : 'Create Team'}
        </button>
      </form>
    </div>
  )
}
