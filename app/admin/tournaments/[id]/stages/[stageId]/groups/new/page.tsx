'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import styles from '@/styles/components/Form.module.scss'
import Link from 'next/link'

export default function CreateGroupPage() {
  const { id, stageId } = useParams()
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Group name is required')
      return
    }

    setLoading(true)

    if (!stageId || typeof stageId !== 'string') {
        toast.error('Invalid stage ID')
        return
      }
      

    const { error } = await supabase.from('groups').insert({
      name,
      stage_id: stageId,
      tournament_id: id,

    })

    if (error) {
      toast.error('Failed to create group')
    } else {
      toast.success('Group created successfully')
      router.push(`/admin/tournaments/${id}/stages`)
    }

    setLoading(false)
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.heading}>Create Group</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Group Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            required
          />
        </label>

        <div className={styles.buttonRow}>
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Creating...' : 'Create Group'}
          </button>
          <Link href={`/admin/tournaments/${id}/stages`} className={styles.cancelButton}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
