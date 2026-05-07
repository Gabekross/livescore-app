'use client'

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import { supabase }            from '@/lib/supabase'
import { useAdminOrg }         from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }     from '@/components/admin/AdminOrgGate'
import toast                   from 'react-hot-toast'
import styles                  from '@/styles/components/Form.module.scss'
import { POSITIONS }           from '@/lib/constants/positions'

interface Team {
  id:   string
  name: string
}

export default function NewPlayerPage() {
  const router = useRouter()
  const { orgId, loading: orgLoading } = useAdminOrg()
  const orgGate = useAdminOrgGate()

  const [teams,   setTeams]   = useState<Team[]>([])
  const [form,    setForm]    = useState({ first_name: '', last_name: '', phone_number: '', jersey_number: '', team_id: '', position: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!orgId) return
    const fetchTeams = async () => {
      const { data } = await supabase
        .from('teams')
        .select('id, name')
        .eq('organization_id', orgId)
        .order('name')
      setTeams(data || [])
    }
    fetchTeams()
  }, [orgId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.first_name.trim() || !form.team_id) {
      toast.error('First name and team are required')
      return
    }

    const fullName = [form.first_name.trim(), form.last_name.trim()].filter(Boolean).join(' ')

    setLoading(true)
    const { error } = await supabase.from('players').insert({
      first_name:    form.first_name.trim(),
      last_name:     form.last_name.trim() || null,
      name:          fullName,
      phone_number:  form.phone_number.trim() || null,
      jersey_number: form.jersey_number ? Number(form.jersey_number) : null,
      team_id:       form.team_id,
      position:      form.position || null,
    })

    if (error) {
      toast.error('Failed to add player')
    } else {
      toast.success('Player added successfully!')
      router.back()
    }
    setLoading(false)
  }

  if (orgGate) return orgGate

  return (
    <div className={styles.formContainer}>
      <Link href="/admin/teams" className={styles.backButton}>
        &#8592; Back to Teams
      </Link>

      <h1 className={styles.heading}>Add New Player</h1>
      <p className={styles.subheading}>
        Add a player to one of your organisation's teams.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Player Details</div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              First Name *
              <input
                type="text"
                placeholder="e.g. John"
                value={form.first_name}
                onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                className={styles.input}
                required
              />
            </label>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Last Name <span className={styles.labelHint}>(optional)</span>
              <input
                type="text"
                placeholder="e.g. Smith"
                value={form.last_name}
                onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                className={styles.input}
              />
            </label>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Phone Number <span className={styles.labelHint}>(optional)</span>
              <input
                type="tel"
                placeholder="e.g. +233 501 234 567"
                value={form.phone_number}
                onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))}
                className={styles.input}
              />
            </label>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Jersey Number <span className={styles.labelHint}>(optional)</span>
              <input
                type="number"
                placeholder="#"
                value={form.jersey_number}
                onChange={(e) => setForm((p) => ({ ...p, jersey_number: e.target.value }))}
                className={styles.input}
              />
            </label>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Position <span className={styles.labelHint}>(optional)</span>
              <select
                value={form.position}
                onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                className={styles.input}
              >
                <option value="">Select Position</option>
                {POSITIONS.map((pos) => (
                  <option key={pos.value} value={pos.value}>{pos.short} – {pos.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Team *
              <select
                value={form.team_id}
                onChange={(e) => setForm((p) => ({ ...p, team_id: e.target.value }))}
                className={styles.input}
                required
              >
                <option value="">Select Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className={styles.buttonRow}>
          <button type="submit" disabled={loading || orgLoading} className={styles.button}>
            {loading ? 'Adding…' : 'Add Player'}
          </button>
          <Link href="/admin/teams" className={styles.cancelButton}>Cancel</Link>
        </div>
      </form>
    </div>
  )
}
