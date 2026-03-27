'use client'

import { useState }          from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase }          from '@/lib/supabase'
import toast                 from 'react-hot-toast'
import styles                from '@/styles/components/Form.module.scss'

export default function NewStagePage() {
  const { id }   = useParams()
  const router   = useRouter()

  const [name,          setName]          = useState('')
  const [order,         setOrder]         = useState(1)
  const [showStandings, setShowStandings] = useState(true)
  const [loading,       setLoading]       = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Stage name is required')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('tournament_stages').insert({
      tournament_id:  id,
      stage_name:     name.trim(),
      order_number:   order,
      show_standings: showStandings,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Stage created!')
      setTimeout(() => router.push(`/admin/tournaments/${id}/stages`), 800)
    }

    setLoading(false)
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.heading}>Add New Stage</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Stage Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            required
            placeholder="e.g. Group Stage, Semi-Finals, Final"
          />
        </label>

        <label className={styles.label}>
          Order Number:
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value, 10))}
            className={styles.input}
            min={1}
            required
          />
        </label>

        <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={showStandings}
            onChange={(e) => setShowStandings(e.target.checked)}
          />
          Show standings table for this stage
          <small style={{ color: '#888', marginLeft: '0.25rem' }}>
            (uncheck for knockout rounds)
          </small>
        </label>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Creating…' : 'Create Stage'}
        </button>
      </form>
    </div>
  )
}
