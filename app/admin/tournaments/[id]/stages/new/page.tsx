'use client'

import { useState }          from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase }          from '@/lib/supabase'
import Link                  from 'next/link'
import toast                 from 'react-hot-toast'
import styles                from '@/styles/components/Form.module.scss'
import { useAdminOrg }       from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }   from '@/components/admin/AdminOrgGate'

export default function NewStagePage() {
  const { id }   = useParams()
  const router   = useRouter()
  const { orgId } = useAdminOrg()
  const orgGate   = useAdminOrgGate()

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

  if (orgGate) return orgGate

  return (
    <div className={styles.formContainer}>
      <Link href={`/admin/tournaments/${id}/stages`} className={styles.backButton}>
        &#8592; Back to Stages
      </Link>

      <h1 className={styles.heading}>Add New Stage</h1>
      <p className={styles.subheading}>
        Create a stage for this tournament (e.g. Group Stage, Semi-Finals, Final).
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Stage Details</div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Stage Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              required
              placeholder="e.g. Group Stage, Semi-Finals, Final"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Order Number <span className={styles.labelHint}>(determines display sequence)</span>
            </label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value, 10))}
              className={styles.input}
              min={1}
              required
              style={{ maxWidth: '120px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem' }}>
            <input
              type="checkbox"
              checked={showStandings}
              onChange={(e) => setShowStandings(e.target.checked)}
              className={styles.checkbox}
              id="showStandings"
            />
            <label htmlFor="showStandings" style={{ fontSize: '0.88rem', color: '#374151', cursor: 'pointer' }}>
              Show standings table for this stage
              <span style={{ fontSize: '0.78rem', color: '#9ca3af', marginLeft: '0.4rem' }}>
                (uncheck for knockout rounds)
              </span>
            </label>
          </div>
        </div>

        <div className={styles.buttonRow}>
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Creating...' : 'Create Stage'}
          </button>
          <Link href={`/admin/tournaments/${id}/stages`} className={styles.cancelButton}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
