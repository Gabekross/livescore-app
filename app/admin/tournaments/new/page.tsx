'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewTournamentPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.from('tournaments').insert({
      name,
      start_date: startDate,
      end_date: endDate,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/admin/tournaments')
    }

    setLoading(false)
  }

  return (
    <div className="form-container">
      <h2>Create New Tournament</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Tournament Name:
          <input type="text" value={name} onChange={e => setName(e.target.value)} required />
        </label>

        <label>
          Start Date:
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </label>

        <label>
          End Date:
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Tournament'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  )
}
