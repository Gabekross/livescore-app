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
  name: string
  jersey_number?: number
  position?: string
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
    const { data, error } = await supabase.from('players').select('*').eq('team_id', teamId)
    if (!error && data) {
      setPlayers(data)
    }
  }

  const handleAddPlayer = () => {
    setPlayers([...players, { name: '' }])
  }

  const handleRemovePlayer = (index: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePlayerChange = (index: number, key: keyof PlayerInput, value: any) => {
    setPlayers((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const data: any[] = XLSX.utils.sheet_to_json(sheet)
      const parsedPlayers: PlayerInput[] = data.map((row) => ({
        name: row.name || row.Name,
        jersey_number: row.jersey_number || row.Number,
        position: row.position || row.Position,
      }))
      setPlayers(parsedPlayers)
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

    const { error: updateError } = await supabase.from('teams')
      .update({ name, logo_url: uploadedLogoUrl || null, coach_name: coachName.trim() || null })
      .eq('id', id)

    if (updateError) {
      toast.error('Update failed')
      setLoading(false)
      return
    }

    // Replace existing players
    await supabase.from('players').delete().eq('team_id', id)

    const toInsert = players.filter(p => p.name).map(p => ({
      team_id: id,
      name: p.name,
      jersey_number: p.jersey_number,
      position: p.position,
    }))

    if (toInsert.length) {
      const { error: playerError } = await supabase.from('players').insert(toInsert)
      if (playerError) toast.error('Some players failed to save')
    }

    toast.success('Team updated!')
    setTimeout(() => router.push('/admin/teams'), 1000)
    setLoading(false)
  }

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

          {players.map((player, idx) => (
            <div key={idx} className={styles.playerRow}>
              <input
                type="text"
                placeholder="Player Name"
                value={player.name}
                onChange={(e) => handlePlayerChange(idx, 'name', e.target.value)}
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

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Updating...' : 'Update Team'}
        </button>
      </form>
    </div>
  )
}
