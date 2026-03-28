'use client'

import { useState }           from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase }            from '@/lib/supabase'
import toast                   from 'react-hot-toast'
import styles                  from '@/styles/components/Form.module.scss'
import Link                    from 'next/link'
import { useAdminOrg }         from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }     from '@/components/admin/AdminOrgGate'

export default function CreateGroupPage() {
  const { id, stageId } = useParams()
  const router          = useRouter()
  const { orgId } = useAdminOrg()
  const orgGate   = useAdminOrgGate()
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

  if (orgGate) return orgGate

  return (
    <div className={styles.formContainer}>
      <Link href={`/admin/tournaments/${id}/stages`} className={styles.backButton}>
        &#8592; Back to Stages
      </Link>

      <h1 className={styles.heading}>Create Group</h1>
      <p className={styles.subheading}>
        Add a group to this stage (e.g. Group A, Group B).
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Group Details</div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              required
              placeholder="e.g. Group A"
            />
          </div>
        </div>

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
