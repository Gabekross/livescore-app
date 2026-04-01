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

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
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

  const handleArchiveToggle = async (tournament: Tournament) => {
    const action = tournament.is_archived ? 'unarchive' : 'archive'
    const confirmed = window.confirm(
      tournament.is_archived
        ? `Restore "${tournament.name}" to active tournaments?`
        : `Archive "${tournament.name}"?\n\nIt will move to the archive section and no longer appear under active tournaments. All data is preserved.`
    )
    if (!confirmed) return

    const { error } = await supabase
      .from('tournaments')
      .update({ is_archived: !tournament.is_archived })
      .eq('id', tournament.id)

    if (error) {
      toast.error(`Failed to ${action} tournament`)
    } else {
      toast.success(tournament.is_archived ? 'Tournament restored to active' : 'Tournament archived')
      fetchTournaments()
    }
  }

  const handleDelete = async (tournamentId: string, tournamentName: string) => {
    const confirmed = window.confirm(
      `Delete "${tournamentName}"?\n\nThis will permanently delete all stages, groups, matches, and match data associated with this tournament. This cannot be undone.`
    )
    if (!confirmed) return

    // Delete matches referencing this tournament first (FK has no cascade)
    const { error: matchError } = await supabase
      .from('matches')
      .delete()
      .eq('tournament_id', tournamentId)

    if (matchError) {
      toast.error('Failed to delete tournament matches')
      return
    }

    // Now delete the tournament (stages, groups, group_teams cascade automatically)
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId)

    if (error) {
      toast.error('Failed to delete tournament')
    } else {
      toast.success('Tournament deleted')
      fetchTournaments()
    }
  }

  if (orgGate) return orgGate

  return (
    <div className={styles.container}>
      <Link href="/admin/dashboard" className={styles.backButton}>
        &#8592; Back to Dashboard
      </Link>

      <div className={styles.topBar}>
        <div>
          <h1 className={styles.heading}>Tournaments</h1>
          <p className={styles.subheading}>Manage tournaments, stages, groups, and matches.</p>
        </div>
        <Link href="/admin/tournaments/new" className={styles.newButton}>
          + New Tournament
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <div className={styles.emptyState}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>
            No tournaments yet
          </p>
          <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
            Create your first tournament to get started with fixtures and standings.
          </p>
        </div>
      ) : (
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
                  </div>
                  <div className={styles.actionButtons}>
                    <button onClick={handleSave}>Save Changes</button>
                    <button onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className={styles.linkRow}>
                  <Link href={`/admin/tournaments/${t.id}/stages`} className={styles.link}>
                    <div>
                      <h3>
                        {t.name}
                        {t.is_archived && <span className={styles.archivedBadge}>Archived</span>}
                      </h3>
                      <p>{formatDate(t.start_date)} — {formatDate(t.end_date)}</p>
                    </div>
                  </Link>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => handleEdit(t)} className={styles.secondaryButtonSmall}>
                      Edit
                    </button>
                    <button
                      onClick={() => handleArchiveToggle(t)}
                      className={styles.secondaryButtonSmall}
                      style={t.is_archived
                        ? { color: '#16a34a', borderColor: '#bbf7d0' }
                        : { color: '#d97706', borderColor: '#fde68a' }
                      }
                    >
                      {t.is_archived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      className={styles.secondaryButtonSmall}
                      style={{ color: '#ef4444', borderColor: '#fecaca' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
