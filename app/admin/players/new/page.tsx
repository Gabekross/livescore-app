'use client'

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import { supabase }            from '@/lib/supabase'
import { useOrg }              from '@/hooks/useOrg'
import toast                   from 'react-hot-toast'

interface Team {
  id:   string
  name: string
}

export default function NewPlayerPage() {
  const router = useRouter()
  const { orgId } = useOrg()

  const [teams,   setTeams]   = useState<Team[]>([])
  const [form,    setForm]    = useState({ name: '', jersey_number: '', team_id: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!orgId) return
    const fetchTeams = async () => {
      const { data } = await supabase
        .from('teams')
        .select('id, name')
        .eq('organization_id', orgId)
        .order('name')
      setTeams(data || [])
    }
    fetchTeams()
  }, [orgId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.team_id) {
      toast.error('Player name and team are required')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('players').insert({
      name:          form.name.trim(),
      jersey_number: form.jersey_number ? Number(form.jersey_number) : null,
      team_id:       form.team_id,
    })

    if (error) {
      toast.error('Failed to add player')
    } else {
      toast.success('Player added successfully!')
      router.back()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '2rem', maxWidth: 480 }}>
      <h1>Add New Player</h1>

      <input
        type="text"
        placeholder="Player Name"
        value={form.name}
        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        required
        style={{ display: 'block', marginBottom: '1rem', width: '100%', padding: '0.5rem' }}
      />

      <input
        type="number"
        placeholder="Jersey Number (optional)"
        value={form.jersey_number}
        onChange={(e) => setForm((p) => ({ ...p, jersey_number: e.target.value }))}
        style={{ display: 'block', marginBottom: '1rem', width: '100%', padding: '0.5rem' }}
      />

      <select
        value={form.team_id}
        onChange={(e) => setForm((p) => ({ ...p, team_id: e.target.value }))}
        required
        style={{ display: 'block', marginBottom: '1rem', width: '100%', padding: '0.5rem' }}
      >
        <option value="">Select Team</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>{team.name}</option>
        ))}
      </select>

      <button type="submit" disabled={loading} style={{ padding: '0.6rem 1.2rem' }}>
        {loading ? 'Adding…' : 'Add Player'}
      </button>
    </form>
  )
}
