'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import styles from '@/styles/components/TournamentForm.module.scss'




export default function NewTournamentPage() {

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const router = useRouter()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !startDate || !endDate) {
      toast.error('Please fill in all fields')
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date cannot be after end date')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('tournaments').insert({
      name,
      start_date: startDate,
      end_date: endDate,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('✅ Tournament created successfully!')
      setTimeout(() => router.push('/admin/tournaments'), 1000)
    }

    setLoading(false)
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.heading}>Create New Tournament</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Tournament Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            required
          />
        </label>

        <label className={styles.label}>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={styles.input}
            required
          />
        </label>

        <label className={styles.label}>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={styles.input}
            required
          />
        </label>

        <button type="submit" disabled={loading} className={styles.button}>
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
      </form>
    </div>
  )
}
