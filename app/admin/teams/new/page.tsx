'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import styles from '@/styles/components/TeamForm.module.scss'
import { v4 as uuidv4 } from 'uuid'
import * as XLSX from 'xlsx'

interface PlayerInput {
  name: string
  jersey_number?: number
  position?: string
}

export default function CreateTeamPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [players, setPlayers] = useState<PlayerInput[]>([])
  const [loading, setLoading] = useState(false)

  const handleAddPlayer = () => {
    setPlayers([...players, { name: '' }])
  }

  const handlePlayerChange = (index: number, key: keyof PlayerInput, value: any) => {
  const updated = [...players]; // ✅ copy the current state
  updated[index] = { ...updated[index], [key]: value }; // ✅ safely update one property
  setPlayers(updated); // ✅ set new state
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      const filePath = `${fileName}`

      const { error: uploadError } =  await supabase.storage
      .from('team-logos')
      .upload(filePath, logoFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: logoFile.type || 'image/png',
      })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error('Failed to upload logo')
        setLoading(false)
        return
      }

      const { data } = supabase.storage
        .from('team-logos')
        .getPublicUrl(filePath)

      uploadedLogoUrl = data.publicUrl
    }

    const { data: teamData, error } = await supabase.from('teams').insert({
      name,
      logo_url: uploadedLogoUrl || null
    }).select().single()

    if (error || !teamData) {
      toast.error(error?.message || 'Failed to create team')
      setLoading(false)
      return
    }

    const toInsert = players.filter(p => p.name).map(p => ({
      team_id: teamData.id,
      name: p.name,
      jersey_number: p.jersey_number,
      position: p.position,
    }))

    if (toInsert.length) {
      const { error: playerError } = await supabase.from('players').insert(toInsert)
      if (playerError) toast.error('Some players failed to save')
    }

    toast.success('Team created successfully!')
    setTimeout(() => router.push('/admin/teams'), 1000)
    setLoading(false)
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.heading}>Create New Team</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Team Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            required
          />
        </label>

        <label className={styles.label}>
          Upload Logo (optional):
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
        </label>

        <h3 className={styles.subheading}>Players</h3>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className={styles.input}
        />
        <button type="button" onClick={handleAddPlayer} className={styles.secondaryButton}>+ Add Player</button>

        {players.map((player, idx) => (
          <div key={idx} className={styles.playerRow}>
            <input
              type="text"
              placeholder="Player Name"
              value={player.name}
              onChange={(e) => handlePlayerChange(idx, 'name', e.target.value)}
              className={styles.input}
            />
            <input
              type="number"
              placeholder="Jersey Number"
              value={player.jersey_number || ''}
              onChange={(e) => handlePlayerChange(idx, 'jersey_number', Number(e.target.value))}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Position"
              value={player.position || ''}
              onChange={(e) => handlePlayerChange(idx, 'position', e.target.value)}
              className={styles.input}
            />
          </div>
        ))}

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Creating...' : 'Create Team'}
        </button>
      </form>
    </div>
  )
}
