'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NewPlayerPage() {
  const router = useRouter()
  // const [teams, setTeams] = useState([])

  interface Team {
  id: string
  name: string
  }

  const [teams, setTeams] = useState<Team[]>([]) // ✅ Correct type

  
  const [form, setForm] = useState({
    name: '',
    jersey_number: '',
    team_id: '',
  })

  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await supabase.from('teams').select('id, name')
      setTeams(data || [])
    }
    fetchTeams()
  }, [])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const { error } = await supabase.from('players').insert([
      {
        name: form.name,
        jersey_number: form.jersey_number,
        team_id: form.team_id,
      }
    ])

    if (error) {
      alert('Failed to add player')
    } else {
      alert('Player added successfully!')
      router.back()
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
      <h1>Add New Player</h1>

      <input
        type="text"
        placeholder="Player Name"
        value={form.name}
        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
        required
        style={{ display: 'block', marginBottom: '1rem' }}
      />

      <input
        type="number"
        placeholder="Jersey Number"
        value={form.jersey_number}
        onChange={(e) => setForm(prev => ({ ...prev, jersey_number: e.target.value }))}
        style={{ display: 'block', marginBottom: '1rem' }}
      />

      <select
        value={form.team_id}
        onChange={(e) => setForm(prev => ({ ...prev, team_id: e.target.value }))}
        required
        style={{ display: 'block', marginBottom: '1rem' }}
      >
        <option value="">Select Team</option>
        {teams.map((team: any) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>

      <button type="submit">Add Player</button>
    </form>
  )
}
