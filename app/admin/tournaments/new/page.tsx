'use client'

import { useState }          from 'react'
import { useRouter }         from 'next/navigation'
import Link                  from 'next/link'
import { supabase }          from '@/lib/supabase'
import { useAdminOrg }       from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }   from '@/components/admin/AdminOrgGate'
import { toSlug }            from '@/lib/utils/slug'
import toast                 from 'react-hot-toast'
import styles                from '@/styles/components/TournamentForm.module.scss'
import shared                from '@/styles/components/AdminShared.module.scss'

export default function NewTournamentPage() {
  const router = useRouter()
  const { orgId, loading: orgLoading } = useAdminOrg()
  const orgGate = useAdminOrgGate()

  const [name,      setName]      = useState('')
  const [slug,      setSlug]      = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')
  const [venue,     setVenue]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [slugDirty, setSlugDirty] = useState(false)
  const [errors,    setErrors]    = useState<Record<string, string>>({})

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugDirty) setSlug(toSlug(value))
  }

  const handleSlugChange = (value: string) => {
    setSlug(value)
    setSlugDirty(true)
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!name.trim())   next.name      = 'Tournament name is required'
    if (!startDate)     next.startDate = 'Start date is required'
    if (!endDate)       next.endDate   = 'End date is required'
    if (startDate && endDate && new Date(startDate) > new Date(endDate))
      next.endDate = 'End date must be after start date'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const finalSlug = slug.trim() || toSlug(name)
    if (!finalSlug) {
      toast.error('Could not generate a valid slug from the tournament name')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('tournaments').insert({
      organization_id: orgId,
      name:            name.trim(),
      slug:            finalSlug,
      start_date:      startDate,
      end_date:        endDate,
      venue:           venue.trim() || null,
    })

    if (error) {
      if (error.code === '23505') {
        toast.error(`A tournament with slug "${finalSlug}" already exists. Please choose a different name.`)
      } else {
        toast.error(error.message)
      }
    } else {
      toast.success('Tournament created successfully!')
      setTimeout(() => router.push('/admin/tournaments'), 800)
    }

    setLoading(false)
  }

  if (orgGate) return orgGate

  return (
    <div className={styles.formContainer}>
      <Link href="/admin/tournaments" className={styles.backButton}>
        &#8592; Back to Tournaments
      </Link>

      <h1 className={styles.heading}>Create New Tournament</h1>
      <p className={styles.subheading}>
        Set up a new tournament with stages, groups, and fixtures.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Tournament Details</div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Tournament Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => !name.trim() && setErrors(p => ({ ...p, name: 'Tournament name is required' }))}
              className={`${styles.input} ${errors.name ? shared.inputInvalid : ''}`}
              placeholder="e.g. Premier League 2026"
            />
            {errors.name && <span className={shared.fieldError}>{errors.name}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              URL Slug <span className={styles.labelHint}>(auto-generated from name)</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className={styles.input}
              placeholder="auto-generated from name"
            />
            <span className={styles.slugPreview}>
              /tournaments/{slug || 'my-tournament'}
            </span>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setErrors(p => ({ ...p, startDate: '' })) }}
                className={`${styles.input} ${errors.startDate ? shared.inputInvalid : ''}`}
              />
              {errors.startDate && <span className={shared.fieldError}>{errors.startDate}</span>}
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setErrors(p => ({ ...p, endDate: '' })) }}
                className={`${styles.input} ${errors.endDate ? shared.inputInvalid : ''}`}
              />
              {errors.endDate && <span className={shared.fieldError}>{errors.endDate}</span>}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Venue <span className={styles.labelHint}>(optional)</span>
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className={styles.input}
              placeholder="e.g. National Stadium"
            />
          </div>
        </div>

        <div className={styles.buttonRow}>
          <button type="submit" disabled={loading || orgLoading} className={styles.button}>
            {loading ? 'Creating...' : 'Create Tournament'}
          </button>
          <Link href="/admin/tournaments" className={styles.cancelButton}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
