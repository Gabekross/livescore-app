'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import styles from '@/styles/components/Form.module.scss'

export default function EditStagePage() {
  const { id, stageId } = useParams()
  const router = useRouter()

  const [stageName, setStageName] = useState('')
  const [orderNumber, setOrderNumber] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchStage = async () => {
      if (!stageId || typeof stageId !== 'string') return

      const { data, error } = await supabase
        .from('tournament_stages')
        .select('*')
        .eq('id', stageId)
        .single()

      if (error || !data) {
        toast.error('Failed to load stage')
        return
      }

      setStageName(data.stage_name)
      setOrderNumber(data.order_number)
    }

    fetchStage()
  }, [stageId])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stageName.trim()) {
      toast.error('Stage name is required')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('tournament_stages')
      .update({
        stage_name: stageName,
        order_number: orderNumber,
      })
      .eq('id', stageId)

    if (error) {
      toast.error('Failed to update stage')
    } else {
      toast.success('Stage updated!')
      router.push(`/admin/tournaments/${id}/stages`)
    }

    setLoading(false)
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.heading}>Edit Stage</h2>
      <form onSubmit={handleUpdate} className={styles.form}>
        <label className={styles.label}>
          Stage Name:
          <input
            type="text"
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            className={styles.input}
            required
          />
        </label>

        <label className={styles.label}>
          Order Number:
          <input
            type="number"
            value={orderNumber}
            onChange={(e) => setOrderNumber(parseInt(e.target.value))}
            className={styles.input}
            min={1}
            required
          />
        </label>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Updating...' : 'Update Stage'}
        </button>
      </form>
    </div>
  )
}
