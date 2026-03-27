'use client'

import { useState }           from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase }            from '@/lib/supabase'
import toast                   from 'react-hot-toast'
import styles                  from '@/styles/components/Form.module.scss'
import Link                    from 'next/link'

export default function CreateGroupPage() {
  const { id, stageId } = useParams()
  const router          = useRouter()
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Group name is required')
      return
    }
    if (!stageId || typeof stageId !== 'string') {
      toast.error('Invalid stage ID')
      return
    }

    setLoading(true)

    // Only stage_id and name — groups table has no tournament_id column
    const { error } = await supabase.from('groups').insert({
      name:     name.trim(),
      stage_id: stageId,
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
            placeholder="e.g. Group A"
          />
        </label>

        <div className={styles.buttonRow}>
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Creating…' : 'Create Group'}
          </button>
          <Link href={`/admin/tournaments/${id}/stages`} className={styles.cancelButton}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
