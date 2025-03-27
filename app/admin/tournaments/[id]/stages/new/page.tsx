'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import styles from '@/styles/components/Form.module.scss'

export default function NewStagePage() {
  const { id } = useParams()
  const router = useRouter()
  const [name, setName] = useState('')
  const [order, setOrder] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Stage name is required')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('tournament_stages').insert({
      tournament_id: id,
      stage_name: name,
      order_number: order,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Stage created!')
      setTimeout(() => router.push(`/admin/tournaments/${id}/stages`), 1000)
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
          />
        </label>

        <label className={styles.label}>
          Order Number:
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value))}
            className={styles.input}
            min={1}
            required
          />
        </label>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Creating...' : 'Create Stage'}
        </button>
      </form>
    </div>
  )
}
