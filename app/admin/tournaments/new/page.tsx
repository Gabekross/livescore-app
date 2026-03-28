'use client'

import { useState }          from 'react'
import { useRouter }         from 'next/navigation'
import { supabase }          from '@/lib/supabase'
import { useAdminOrg }       from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }   from '@/components/admin/AdminOrgGate'
import { toSlug }            from '@/lib/utils/slug'
import toast                 from 'react-hot-toast'
import styles                from '@/styles/components/TournamentForm.module.scss'

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
  // Tracks whether the user has manually edited the slug field.
  // If not, slug auto-derives from name.
  const [slugDirty, setSlugDirty] = useState(false)

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugDirty) setSlug(toSlug(value))
  }

  const handleSlugChange = (value: string) => {
    setSlug(value)
    setSlugDirty(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !startDate || !endDate) {
      toast.error('Please fill in all required fields')
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date cannot be after end date')
      return
    }

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
      <h2 className={styles.heading}>Create New Tournament</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Tournament Name:
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={styles.input}
            required
          />
        </label>

        <label className={styles.label}>
          Slug (URL identifier):
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            className={styles.input}
            placeholder="auto-generated from name"
          />
          <small style={{ color: '#888' }}>
            Used in public URLs, e.g. /tournaments/{slug || 'my-tournament'}
          </small>
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

        <label className={styles.label}>
          Venue (optional):
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className={styles.input}
            placeholder="e.g. National Stadium"
          />
        </label>

        <button type="submit" disabled={loading || orgLoading} className={styles.button}>
          {loading ? 'Creating…' : 'Create Tournament'}
        </button>
      </form>
    </div>
  )
}
