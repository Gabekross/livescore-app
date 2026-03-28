'use client'

// app/platform/organizations/page.tsx
// Power admin: list and create organizations. Dark theme matching platform layout.

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import toast        from 'react-hot-toast'

interface Organization {
  id:         string
  name:       string
  slug:       string
  created_at: string
  _adminCount?: number
}

export default function PlatformOrganizationsPage() {
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      toast.error('Name and slug are required')
      return
    }
    setSaving(true)

    // Use the provisioning function if we want auto site_settings,
    // but for power_admin manual creation, just create the org + settings
    const { data: org, error } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      })
      .select('id')
      .single()

    if (error) {
      toast.error(error.code === '23505' ? 'Slug already taken.' : error.message)
      setSaving(false)
      return
    }

    // Auto-create site_settings defaults
    if (org) {
      await supabase.from('site_settings').insert({
        organization_id: org.id,
        site_name: name.trim(),
        site_tagline: 'Live football scores, fixtures and standings.',
        active_theme: 'theme-uefa-dark',
      })
    }

    toast.success('Organization created')
    setName('')
    setSlug('')
    fetchOrgs()
    setSaving(false)
  }

  const cardStyle: React.CSSProperties = {
    background: '#141420', border: '1px solid #1e1e2e', borderRadius: '10px',
    padding: '1rem 1.25rem',
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f0ff', marginBottom: '0.25rem' }}>
        Organizations
      </h1>
      <p style={{ fontSize: '0.85rem', color: '#8888aa', marginBottom: '2rem' }}>
        Each organization gets its own site, teams, tournaments, and admin workspace.
      </p>

      {/* Create form */}
      <form onSubmit={handleCreate} style={{ ...cardStyle, marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8888aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
          Create Organization
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
              background: '#0a0a14', border: '1px solid #2a2a3e', borderRadius: '8px',
              color: '#e8e8f0', fontSize: '0.88rem',
            }}
          />
          <input
            type="text"
            placeholder="url-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            style={{
              flex: 1, minWidth: '140px', padding: '0.55rem 0.8rem',
              background: '#0a0a14', border: '1px solid #2a2a3e', borderRadius: '8px',
              color: '#e8e8f0', fontSize: '0.88rem', fontFamily: 'monospace',
            }}
          />
          <button type="submit" disabled={saving} style={{
            padding: '0.55rem 1.2rem', background: '#6366f1', color: '#fff',
            border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem',
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1,
          }}>
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>

      {/* Org list */}
      {loading ? (
        <p style={{ color: '#8888aa' }}>Loading...</p>
      ) : orgs.length === 0 ? (
        <p style={{ color: '#8888aa' }}>No organizations yet. Create one above.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {orgs.map((org) => (
            <div key={org.id} style={{
              ...cardStyle, display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: '1rem',
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#e8e8f0', fontSize: '0.9rem' }}>{org.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#666688', fontFamily: 'monospace' }}>{org.slug}</div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6666888' }}>
                {new Date(org.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
