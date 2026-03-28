'use client'

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import { supabase }            from '@/lib/supabase'
import { useAdminOrg }         from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }     from '@/components/admin/AdminOrgGate'
import toast                   from 'react-hot-toast'
import styles                  from '@/styles/components/Form.module.scss'

interface Team {
  id:   string
  name: string
}

export default function NewPlayerPage() {
  const router = useRouter()
  const { orgId, loading: orgLoading } = useAdminOrg()
  const orgGate = useAdminOrgGate()

  const [teams,   setTeams]   = useState<Team[]>([])
  const [form,    setForm]    = useState({ name: '', jersey_number: '', team_id: '' })
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
    if (!form.name.trim() || !form.team_id) {
      toast.error('Player name and team are required')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('players').insert({
      name:          form.name.trim(),
      jersey_number: form.jersey_number ? Number(form.jersey_number) : null,
      team_id:       form.team_id,
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
              Player Name *
              <input
                type="text"
                placeholder="e.g. John Smith"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={styles.input}
                required
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
