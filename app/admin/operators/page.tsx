'use client'

// app/admin/operators/page.tsx
// Org admin page to manage match_operator accounts.
// Operators are restricted game-day users who can only update match scores/status.

import { useEffect, useState, useCallback } from 'react'
import { useAdminOrg }     from '@/contexts/AdminOrgContext'
import { useAdminOrgGate } from '@/components/admin/AdminOrgGate'
import FeatureGate         from '@/components/admin/FeatureGate'
import toast               from 'react-hot-toast'

interface Operator {
  id:         string
  email:      string | null
  full_name:  string | null
  role:       string
  created_at: string
}

export default function ManageOperatorsPage() {
  const { role } = useAdminOrg()
  const orgGate = useAdminOrgGate()

  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)

  // Form state for creating a new operator
  const [email, setEmail]       = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Confirm-delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchOperators = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/operators')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load operators')
      setOperators(data.operators || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load operators'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOperators() }, [fetchOperators])

  if (orgGate) return orgGate

  // Only org_admin and power_admin can manage operators
  if (role !== 'org_admin' && role !== 'power_admin') {
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
    setSaving(true)
    try {
      const res = await fetch('/api/admin/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create operator')
      toast.success(`Operator "${fullName}" created`)
      setEmail('')
      setFullName('')
      setPassword('')
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
    try {
      const res = await fetch(`/api/admin/operators?id=${id}`, { method: 'DELETE' })
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

  return (
    <FeatureGate feature="canUseOperators" label="Match Operators">
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
            Match Operators
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
            Game-day users who can update match scores and status — nothing else.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 600,
              background: '#059669', color: '#fff', border: 'none',
              borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            + Add Operator
          </button>
        )}
      </div>

      {/* ── Create form ──────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            margin: '1.5rem 0', padding: '1.25rem', background: '#f0fdf4',
            border: '1px solid #bbf7d0', borderRadius: '10px',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}
        >
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#065f46', margin: 0 }}>
            New Match Operator
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
            This creates a login account for the operator. Share the email and password with them.
            They will only be able to access the game-day match operator screen.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={labelStyle}>Full Name</span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Smith"
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={labelStyle}>Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@example.com"
                style={inputStyle}
              />
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={labelStyle}>Temporary Password</span>
            <input
              type="text"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={{ ...inputStyle, maxWidth: '280px' }}
            />
          </label>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.5rem 1.2rem', fontSize: '0.82rem', fontWeight: 600,
                background: '#059669', color: '#fff', border: 'none',
                borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Creating...' : 'Create Operator'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEmail(''); setFullName(''); setPassword('') }}
              style={{
                padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 600,
                background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb',
                borderRadius: '8px', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Operators list ────────────────────────────────────── */}
      {loading ? (
        <p style={{ color: '#6b7280', marginTop: '2rem' }}>Loading operators...</p>
      ) : operators.length === 0 ? (
        <div style={{
          marginTop: '2rem', padding: '2rem', background: '#f9fafb',
          borderRadius: '10px', textAlign: 'center', color: '#9ca3af',
          border: '1px dashed #e5e7eb',
        }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#6b7280' }}>
            No match operators yet
          </p>
          <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
            Add an operator to let someone update match scores on game day without giving them full admin access.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
          {operators.map((op) => (
            <div
              key={op.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.85rem 1rem', background: '#fff', border: '1px solid #e5e7eb',
                borderRadius: '10px', gap: '0.75rem', flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: '180px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1f2937' }}>
                  {op.full_name || 'Unnamed'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                  {op.email || op.id}
                </div>
              </div>

              <span style={{
                fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.04em', color: '#059669',
                background: 'rgba(5,150,105,0.08)', padding: '3px 8px', borderRadius: '4px',
              }}>
                Operator
              </span>

              {deleteId === op.id ? (
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={() => handleDelete(op.id)}
                    style={{
                      padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600,
                      background: '#ef4444', color: '#fff', border: 'none',
                      borderRadius: '6px', cursor: 'pointer',
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setDeleteId(null)}
                    style={{
                      padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600,
                      background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb',
                      borderRadius: '6px', cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteId(op.id)}
                  style={{
                    padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600,
                    background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                    borderRadius: '6px', cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </FeatureGate>
  )
}

// ── Shared inline styles ──────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem', fontWeight: 600, color: '#374151',
}

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.65rem', fontSize: '0.85rem', border: '1px solid #d1d5db',
  borderRadius: '8px', background: '#fff', color: '#1f2937',
}
