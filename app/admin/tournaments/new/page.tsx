'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'




export default function NewTournamentPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
  
    // Basic validation
    if (!name.trim() || !startDate || !endDate) {
      toast.error('Please fill in all fields')
      setLoading(false)
      return
    }
  
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date cannot be after end date')
      setLoading(false)
      return
    }
  
    const { data, error } = await supabase.from('tournaments').insert({
      name,
      start_date: startDate,
      end_date: endDate,
    })
  
    if (error) {
      toast.error(`❌ ${error.message}`)
    } else {
      toast.success('✅ Tournament created successfully!', {
        icon: '⚽',
        style: {
          borderRadius: '8px',
          background: '#333',
          color: '#fff',
        },})
      setTimeout(() => {
        router.push('/admin/tournaments')
      }, 1000)
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
        {/* ✅ SUCCESS / ERROR MESSAGE GOES HERE */}
        {message && (
            <p
            style={{
                color: messageType === 'error' ? 'red' : 'green',
                marginTop: '1rem',
                fontWeight: 'bold',
            }}
            >
            {message}
            </p>
        )}
        
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>

    
  )

  
}
