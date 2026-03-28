'use client'

import { useEffect, useState, useCallback } from 'react'
import Link                    from 'next/link'
import { supabase }            from '@/lib/supabase'
import { useAdminOrg }         from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }     from '@/components/admin/AdminOrgGate'
import toast                   from 'react-hot-toast'
import styles                  from '@/styles/components/TournamentList.module.scss'

interface Tournament {
  id:          string
  name:        string
  start_date?: string
  end_date?:   string
  is_archived: boolean
}

export default function AdminTournamentList() {
  const { orgId, loading: orgLoading } = useAdminOrg()
  const orgGate = useAdminOrgGate()

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [editId,      setEditId]      = useState<string | null>(null)
  const [formState,   setFormState]   = useState<Partial<Tournament>>({})

  const fetchTournaments = useCallback(async () => {
    if (!orgId) return
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name, start_date, end_date, is_archived')
      .eq('organization_id', orgId)
      .order('start_date')
    if (!error && data) setTournaments(data)
  }, [orgId])

  useEffect(() => { fetchTournaments() }, [fetchTournaments])

  const handleEdit = (tournament: Tournament) => {
    setEditId(tournament.id)
    setFormState(tournament)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!editId) return
    const { error } = await supabase
      .from('tournaments')
      .update({
        name:       formState.name,
        start_date: formState.start_date,
        end_date:   formState.end_date,
      })
      .eq('id', editId)

    if (error) {
      toast.error('Update failed')
    } else {
      toast.success('Tournament updated')
      setEditId(null)
      fetchTournaments()
    }
  }

  if (orgGate) return orgGate

  return (
    <div className={styles.container}>
      <Link href="/admin/dashboard" className={styles.backButton}>
        ← Back to Dashboard
      </Link>
      <h1 className={styles.heading}>Admin – Tournaments</h1>

      <Link href="/admin/tournaments/new" className={styles.newButton}>
        + Add New Tournament
      </Link>

      <ul className={styles.list}>
        {tournaments.map((t) => (
          <li key={t.id} className={styles.item}>
            {editId === t.id ? (
              <div className={styles.editForm}>
                <input
                  name="name"
                  value={formState.name || ''}
                  onChange={handleChange}
                  placeholder="Tournament Name"
                />
                <input
                  type="date"
                  name="start_date"
                  value={formState.start_date || ''}
                  onChange={handleChange}
                />
                <input
                  type="date"
                  name="end_date"
                  value={formState.end_date || ''}
                  onChange={handleChange}
                />
                <div className={styles.actionButtons}>
                  <button onClick={handleSave}>Save</button>
                  <button onClick={() => setEditId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className={styles.linkRow}>
                <Link href={`/admin/tournaments/${t.id}/stages`} className={styles.link}>
                  <div>
                    <h3>{t.name} {t.is_archived && <span style={{ color: '#999', fontSize: '0.8em' }}>(archived)</span>}</h3>
                    <p>{t.start_date?.slice(0, 10)} → {t.end_date?.slice(0, 10)}</p>
                  </div>
                </Link>
                <button onClick={() => handleEdit(t)} className={styles.secondaryButtonSmall}>
                  Edit
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
