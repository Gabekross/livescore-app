'use client'

// app/admin/organizations/page.tsx
// Power admin: list and create organizations.

import { useEffect, useState, useCallback } from 'react'
import { supabase }            from '@/lib/supabase'
import { useAdminOrg }         from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }     from '@/components/admin/AdminOrgGate'
import toast                   from 'react-hot-toast'

interface Organization {
  id:         string
  name:       string
  slug:       string
  created_at: string
}

export default function OrganizationsPage() {
  const { role }  = useAdminOrg()
  const orgGate   = useAdminOrgGate()

  const [orgs, setOrgs]       = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName]       = useState('')
  const [slug, setSlug]       = useState('')
  const [saving, setSaving]   = useState(false)

  const fetchOrgs = useCallback(async () => {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, slug, created_at')
      .order('name')
    setOrgs((data || []) as Organization[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchOrgs() }, [fetchOrgs])

  if (orgGate) return orgGate

  if (role !== 'power_admin') {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#6b7280' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p>Only platform administrators can manage organizations.</p>
      </div>
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      toast.error('Name and slug are required')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('organizations').insert({
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    })
    if (error) {
      toast.error(error.code === '23505' ? 'An organization with this slug already exists.' : error.message)
    } else {
      toast.success('Organization created')
      setName('')
      setSlug('')
      fetchOrgs()
    }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.25rem' }}>
        Organizations
      </h1>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '2rem' }}>
        Platform-wide organization management. Each organization has its own teams, tournaments, content, and settings.
      </p>

      {/* Create form */}
      <form
        onSubmit={handleCreate}
        style={{
          background: '#fff', padding: '1.25rem', borderRadius: '10px',
          border: '1px solid #e5e7eb', marginBottom: '2rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
        }}
      >
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          New Organization
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Organization Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, ''))
            }}
            style={{
              flex: 1, minWidth: '180px', padding: '0.55rem 0.8rem',
              border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem',
            }}
          />
          <input
            type="text"
            placeholder="slug (URL identifier)"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            style={{
              flex: 1, minWidth: '140px', padding: '0.55rem 0.8rem',
              border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem',
              fontFamily: 'monospace',
            }}
          />
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.55rem 1.2rem', background: '#2563eb', color: '#fff',
              border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem',
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>

      {/* Organization list */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading organizations...</p>
      ) : orgs.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No organizations yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {orgs.map((org) => (
            <div
              key={org.id}
              style={{
                background: '#fff', padding: '0.85rem 1.25rem', borderRadius: '10px',
                border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.9rem' }}>{org.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace' }}>{org.slug}</div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                {new Date(org.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
