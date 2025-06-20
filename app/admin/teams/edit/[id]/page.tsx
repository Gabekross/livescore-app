// Enhanced Edit Team Page with Remove Player Feature
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import styles from '@/styles/components/TeamForm.module.scss'
import { v4 as uuidv4 } from 'uuid'
import * as XLSX from 'xlsx'

interface PlayerInput {
  name: string
  jersey_number?: number
  position?: string
}

export default function EditTeamPage() {
  const { id } = useParams()
  const router = useRouter()

  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [players, setPlayers] = useState<PlayerInput[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchTeam = async () => {
      if (!id || typeof id !== 'string') return

      const { data, error } = await supabase.from('teams').select('*').eq('id', id).single()
      if (error) {
        toast.error('Team not found')
        return
      }

      setName(data.name)
      setLogoUrl(data.logo_url || '')
      fetchPlayers(data.id)
    }

    fetchTeam()
  }, [id])

  const fetchPlayers = async (teamId: string) => {
    const { data, error } = await supabase.from('players').select('*').eq('team_id', teamId)
    if (!error && data) {
      console.log("Fetched players from Supabase:", data);

      setPlayers(data)
    }
  }

  const handleAddPlayer = () => {
    setPlayers([...players, { name: '' }])
  }

  const handleRemovePlayer = (index: number) => {
    const updated = [...players]
    updated.splice(index, 1)
    setPlayers(updated)
  }

const handlePlayerChange = (index: number, key: keyof PlayerInput, value: any) => {
  setPlayers((prev) => {
    const updated = [...prev];
    if (!updated[index]) return prev; // Skip if invalid index
    updated[index] = { ...updated[index], [key]: value }; // Safe object update
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
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('team-logos')
        .upload(filePath, logoFile)

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

    const { error: updateError } = await supabase.from('teams')
      .update({ name, logo_url: uploadedLogoUrl || null })
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
      <h2 className={styles.heading}>Edit Team</h2>
      <form onSubmit={handleUpdate} className={styles.form}>
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
            <button type="button" onClick={() => handleRemovePlayer(idx)} className={styles.secondaryButton}>Remove</button>
          </div>
        ))}

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Updating...' : 'Update Team'}
        </button>
      </form>
    </div>
  )
}
