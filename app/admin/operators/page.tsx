'use client'

// app/admin/operators/page.tsx
// Org admin page to manage match_operator accounts and assigned matches.

import { useEffect, useState, useCallback } from 'react'
import { useAdminOrg } from '@/contexts/AdminOrgContext'
import { useAdminOrgGate } from '@/components/admin/AdminOrgGate'
import FeatureGate from '@/components/admin/FeatureGate'
import { formatLocalDateTime } from '@/lib/utils/dateTime'
import toast from 'react-hot-toast'

interface Operator {
  id: string
  email: string | null
  contact_email: string | null
  operator_login_id: string | null
  full_name: string | null
  role: string
  created_at: string
  assigned_match_ids: string[]
}

interface AssignableMatch {
  id: string
  match_date: string
  status: string
  home_team: { name: string } | { name: string }[] | null
  away_team: { name: string } | { name: string }[] | null
  tournament: { name: string } | { name: string }[] | null
}

export default function ManageOperatorsPage() {
  const { orgId, role } = useAdminOrg()
  const orgGate = useAdminOrgGate()

  const [operators, setOperators] = useState<Operator[]>([])
  const [matches, setMatches] = useState<AssignableMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [assignmentSavingId, setAssignmentSavingId] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [loginId, setLoginId] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingOperatorId, setEditingOperatorId] = useState<string | null>(null)
  const [draftAssignments, setDraftAssignments] = useState<Record<string, string[]>>({})

  const fetchOperators = useCallback(async () => {
    if (!orgId) return
    try {
      const res = await fetch(`/api/admin/operators?organization_id=${encodeURIComponent(orgId)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load operators')
      setOperators(data.operators || [])
      setMatches(data.matches || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load operators'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { fetchOperators() }, [fetchOperators])

  if (orgGate) return orgGate

  if (role !== 'org_admin' && role !== 'billing_exempt_admin' && role !== 'power_admin') {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#6b7280' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p>Only organization admins can manage operators.</p>
      </div>
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/operators?organization_id=${encodeURIComponent(orgId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, login_id: loginId, full_name: fullName, password, match_ids: selectedMatchIds }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create operator')
      toast.success(`Operator "${fullName}" created`)
      setEmail('')
      setLoginId('')
      setFullName('')
      setPassword('')
      setSelectedMatchIds([])
      setShowForm(false)
      fetchOperators()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create operator'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!orgId) return
    try {
      const res = await fetch(`/api/admin/operators?id=${id}&organization_id=${encodeURIComponent(orgId)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to remove operator')
      toast.success('Operator removed')
      setDeleteId(null)
      fetchOperators()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove operator'
      toast.error(msg)
    }
  }

  const toggleMatch = (matchId: string, checked: boolean, operatorId?: string) => {
    if (!operatorId) {
      setSelectedMatchIds((prev) => checked ? [...prev, matchId] : prev.filter((id) => id !== matchId))
      return
    }

    setDraftAssignments((prev) => {
      const current = prev[operatorId] || []
      return {
        ...prev,
        [operatorId]: checked ? [...current, matchId] : current.filter((id) => id !== matchId),
      }
    })
  }

  const openAssignmentEditor = (operator: Operator) => {
    setEditingOperatorId(operator.id)
    setDraftAssignments((prev) => ({
      ...prev,
      [operator.id]: operator.assigned_match_ids || [],
    }))
  }

  const saveAssignments = async (operatorId: string) => {
    if (!orgId) return
    setAssignmentSavingId(operatorId)
    try {
      const res = await fetch(`/api/admin/operators?organization_id=${encodeURIComponent(orgId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_id: operatorId, match_ids: draftAssignments[operatorId] || [] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update assignments')
      toast.success('Match assignments updated')
      setEditingOperatorId(null)
      fetchOperators()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update assignments'
      toast.error(msg)
    } finally {
      setAssignmentSavingId(null)
    }
  }

  return (
    <FeatureGate feature="canUseOperators" label="Match Operators">
      <div style={{ maxWidth: '920px', margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
              Match Operators
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
              Game-day users who can update only the matches assigned to them.
            </p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} style={primaryButtonStyle}>
              + Add Operator
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreate} style={createFormStyle}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#065f46', margin: 0 }}>
              New Match Operator
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Give the operator their Login ID and temporary password. A real email address is optional.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <label style={fieldStyle}>
                <span style={labelStyle}>Full Name</span>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. John Smith" style={inputStyle} />
              </label>
              <label style={fieldStyle}>
                <span style={labelStyle}>Login ID</span>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. johnsmith"
                  autoCapitalize="none"
                  style={inputStyle}
                />
              </label>
            </div>

            <label style={fieldStyle}>
              <span style={labelStyle}>Contact Email <span style={{ color: '#9ca3af', fontWeight: 500 }}>(optional)</span></span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="operator@example.com" style={{ ...inputStyle, maxWidth: '360px' }} />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Temporary Password</span>
              <input type="text" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" style={{ ...inputStyle, maxWidth: '280px' }} />
            </label>

            <MatchAssignmentPicker
              matches={matches}
              selectedIds={selectedMatchIds}
              onToggle={(matchId, checked) => toggleMatch(matchId, checked)}
            />

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button type="submit" disabled={saving} style={{ ...primaryButtonStyle, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Creating...' : 'Create Operator'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEmail(''); setLoginId(''); setFullName(''); setPassword(''); setSelectedMatchIds([]) }}
                style={secondaryButtonStyle}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p style={{ color: '#6b7280', marginTop: '2rem' }}>Loading operators...</p>
        ) : operators.length === 0 ? (
          <div style={emptyStateStyle}>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#6b7280' }}>No match operators yet</p>
            <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
              Add an operator to let someone update assigned match scores without full admin access.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
            {operators.map((op) => (
              <div key={op.id} style={operatorCardStyle}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1f2937' }}>
                    {op.full_name || 'Unnamed'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                    Login ID: {op.operator_login_id || op.email || op.id}
                  </div>
                  {op.contact_email && (
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.15rem' }}>
                      Contact: {op.contact_email}
                    </div>
                  )}
                  {!op.operator_login_id && (
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.15rem' }}>
                      Legacy operator: signs in with email
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {op.assigned_match_ids?.length || 0} assigned match{(op.assigned_match_ids?.length || 0) === 1 ? '' : 'es'}
                  </div>
                </div>

                <span style={badgeStyle}>Operator</span>

                <button
                  onClick={() => editingOperatorId === op.id ? setEditingOperatorId(null) : openAssignmentEditor(op)}
                  style={manageButtonStyle}
                >
                  {editingOperatorId === op.id ? 'Close' : 'Manage Matches'}
                </button>

                {deleteId === op.id ? (
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button onClick={() => handleDelete(op.id)} style={dangerButtonStyle}>Confirm</button>
                    <button onClick={() => setDeleteId(null)} style={smallSecondaryButtonStyle}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteId(op.id)} style={removeButtonStyle}>Remove</button>
                )}

                {editingOperatorId === op.id && (
                  <div style={{ flexBasis: '100%', borderTop: '1px solid #e5e7eb', paddingTop: '0.85rem' }}>
                    <MatchAssignmentPicker
                      matches={matches}
                      selectedIds={draftAssignments[op.id] || []}
                      onToggle={(matchId, checked) => toggleMatch(matchId, checked, op.id)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                      <button
                        onClick={() => saveAssignments(op.id)}
                        disabled={assignmentSavingId === op.id}
                        style={{ ...saveAssignmentsButtonStyle, opacity: assignmentSavingId === op.id ? 0.65 : 1 }}
                      >
                        {assignmentSavingId === op.id ? 'Saving...' : 'Save Assignments'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </FeatureGate>
  )
}

function MatchAssignmentPicker({
  matches,
  selectedIds,
  onToggle,
}: {
  matches: AssignableMatch[]
  selectedIds: string[]
  onToggle: (matchId: string, checked: boolean) => void
}) {
  const selected = new Set(selectedIds)

  if (matches.length === 0) {
    return (
      <div style={noMatchesStyle}>
        No matches available to assign yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <span>Assigned Matches</span>
        <span style={{ color: '#6b7280', fontWeight: 500 }}>{selected.size} selected</span>
      </div>
      <div style={matchPickerStyle}>
        {matches.map((match) => {
          const homeTeam = Array.isArray(match.home_team) ? match.home_team[0] : match.home_team
          const awayTeam = Array.isArray(match.away_team) ? match.away_team[0] : match.away_team
          const tournament = Array.isArray(match.tournament) ? match.tournament[0] : match.tournament

          return (
            <label key={match.id} style={matchRowStyle}>
              <input
                type="checkbox"
                checked={selected.has(match.id)}
                onChange={(e) => onToggle(match.id, e.target.checked)}
              />
              <span>
                <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#1f2937' }}>
                  {homeTeam?.name || 'Home'} vs {awayTeam?.name || 'Away'}
                </span>
                <span style={{ display: 'block', fontSize: '0.74rem', color: '#6b7280', marginTop: '0.15rem' }}>
                  {tournament?.name ? `${tournament.name} - ` : ''}{formatLocalDateTime(match.match_date, 'shortDateTime')}
                </span>
              </span>
              <span style={statusStyle}>{match.status}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem', fontWeight: 600, color: '#374151',
}

const fieldStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '0.25rem',
}

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.65rem', fontSize: '0.85rem', border: '1px solid #d1d5db',
  borderRadius: '8px', background: '#fff', color: '#1f2937',
}

const primaryButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 600,
  background: '#059669', color: '#fff', border: 'none',
  borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap',
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 600,
  background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb',
  borderRadius: '8px', cursor: 'pointer',
}

const createFormStyle: React.CSSProperties = {
  margin: '1.5rem 0', padding: '1.25rem', background: '#f0fdf4',
  border: '1px solid #bbf7d0', borderRadius: '10px',
  display: 'flex', flexDirection: 'column', gap: '0.75rem',
}

const emptyStateStyle: React.CSSProperties = {
  marginTop: '2rem', padding: '2rem', background: '#f9fafb',
  borderRadius: '10px', textAlign: 'center', color: '#9ca3af',
  border: '1px dashed #e5e7eb',
}

const operatorCardStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0.85rem 1rem', background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: '10px', gap: '0.75rem', flexWrap: 'wrap',
}

const badgeStyle: React.CSSProperties = {
  fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.04em', color: '#059669',
  background: 'rgba(5,150,105,0.08)', padding: '3px 8px', borderRadius: '4px',
}

const manageButtonStyle: React.CSSProperties = {
  padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600,
  background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
  borderRadius: '6px', cursor: 'pointer',
}

const dangerButtonStyle: React.CSSProperties = {
  padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600,
  background: '#ef4444', color: '#fff', border: 'none',
  borderRadius: '6px', cursor: 'pointer',
}

const smallSecondaryButtonStyle: React.CSSProperties = {
  padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600,
  background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb',
  borderRadius: '6px', cursor: 'pointer',
}

const removeButtonStyle: React.CSSProperties = {
  padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600,
  background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
  borderRadius: '6px', cursor: 'pointer',
}

const saveAssignmentsButtonStyle: React.CSSProperties = {
  padding: '0.45rem 0.9rem', fontSize: '0.78rem', fontWeight: 600,
  background: '#2563eb', color: '#fff', border: 'none',
  borderRadius: '6px', cursor: 'pointer',
}

const noMatchesStyle: React.CSSProperties = {
  padding: '0.85rem', border: '1px dashed #d1d5db', borderRadius: '8px',
  color: '#6b7280', fontSize: '0.82rem', background: '#fff',
}

const matchPickerStyle: React.CSSProperties = {
  maxHeight: '260px', overflowY: 'auto', border: '1px solid #e5e7eb',
  borderRadius: '8px', background: '#fff',
}

const matchRowStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '20px 1fr auto',
  gap: '0.65rem', alignItems: 'center', padding: '0.65rem 0.75rem',
  borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
}

const statusStyle: React.CSSProperties = {
  fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
  color: '#4b5563', background: '#f3f4f6', borderRadius: '4px',
  padding: '2px 6px',
}
