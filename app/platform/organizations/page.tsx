'use client'

// app/platform/organizations/page.tsx
// Power admin: list and create organizations. Dark theme matching platform layout.

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import toast        from 'react-hot-toast'

interface OrgSubscription {
  plan:           string
  status:         string
  trial_ends_at:  string | null
  billing_interval: string | null
}

interface Organization {
  id:                         string
  name:                       string
  slug:                       string
  created_at:                 string
  public_site_enabled:        boolean
  public_site_paused_reason?: string | null
  _adminCount?:               number
  _sub?:                      OrgSubscription | null
}

export default function PlatformOrganizationsPage() {
  const [orgs, setOrgs]       = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName]       = useState('')
  const [slug, setSlug]       = useState('')
  const [saving, setSaving]   = useState(false)
  const [updatingOrgId, setUpdatingOrgId] = useState<string | null>(null)

  const fetchOrgs = useCallback(async () => {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, slug, created_at, public_site_enabled, public_site_paused_reason')
      .order('name')

    const orgList = (data || []) as Organization[]

    // Fetch subscription data for all orgs
    if (orgList.length > 0) {
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('organization_id, plan, status, trial_ends_at, billing_interval')

      const subMap = new Map((subs || []).map((s: { organization_id: string } & OrgSubscription) => [s.organization_id, s]))
      for (const org of orgList) {
        org._sub = (subMap.get(org.id) as OrgSubscription) || null
      }
    }

    setOrgs(orgList)
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
        site_tagline: 'Live scores, fixtures, standings, and more.',
        active_theme: 'theme-uefa-dark',
      })
    }

    toast.success('Organization created')
    setName('')
    setSlug('')
    fetchOrgs()
    setSaving(false)
  }

  const handlePublicSiteToggle = async (org: Organization) => {
    const nextEnabled = !org.public_site_enabled
    let reason: string | null = null

    if (!nextEnabled) {
      const input = window.prompt(
        'Admin-only reason for pausing this public site. This will not be shown to visitors.',
        org.public_site_paused_reason || 'Trial ended / renewal required'
      )
      if (input === null) return
      reason = input.trim() || 'Manually paused by platform admin'
    }

    setUpdatingOrgId(org.id)
    const { error } = await supabase
      .from('organizations')
      .update({
        public_site_enabled: nextEnabled,
        public_site_paused_reason: nextEnabled ? null : reason,
      })
      .eq('id', org.id)

    if (error) {
      toast.error(nextEnabled ? 'Could not reactivate public site' : 'Could not pause public site')
    } else {
      toast.success(nextEnabled ? 'Public site reactivated' : 'Public site paused')
      fetchOrgs()
    }
    setUpdatingOrgId(null)
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
              justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontWeight: 700, color: '#e8e8f0', fontSize: '0.9rem' }}>{org.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#666688', fontFamily: 'monospace' }}>{org.slug}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SiteStatusBadge org={org} />
                <SubBadge sub={org._sub || null} />
                <span style={{ fontSize: '0.72rem', color: '#666688' }}>
                  {new Date(org.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={() => handlePublicSiteToggle(org)}
                  disabled={updatingOrgId === org.id}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: 6,
                    cursor: updatingOrgId === org.id ? 'not-allowed' : 'pointer',
                    opacity: updatingOrgId === org.id ? 0.6 : 1,
                    background: org.public_site_enabled ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
                    border: org.public_site_enabled ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(34,197,94,0.3)',
                    color: org.public_site_enabled ? '#fbbf24' : '#86efac',
                  }}
                  title={
                    org.public_site_enabled
                      ? 'Show a neutral unavailable page to public visitors'
                      : 'Restore the public website'
                  }
                >
                  {org.public_site_enabled ? 'Pause Site' : 'Turn On'}
                </button>
              </div>
              {!org.public_site_enabled && org.public_site_paused_reason && (
                <div style={{
                  flexBasis: '100%',
                  fontSize: '0.74rem',
                  color: '#a1a1aa',
                  borderTop: '1px solid #1e1e2e',
                  paddingTop: '0.65rem',
                }}>
                  Admin reason: {org.public_site_paused_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────── */

function SiteStatusBadge({ org }: { org: Organization }) {
  if (org.public_site_enabled) {
    return <span style={{ ...badgeBase, background: 'rgba(34,197,94,0.12)', color: '#86efac' }}>Site On</span>
  }

  return <span style={{ ...badgeBase, background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>Site Paused</span>
}

function SubBadge({ sub }: { sub: OrgSubscription | null }) {
  if (!sub) {
    return <span style={{ ...badgeBase, background: '#1e1e2e', color: '#555566' }}>No Plan</span>
  }

  const { plan, status } = sub

  if (plan === 'pro' && status === 'active') {
    return <span style={{ ...badgeBase, background: 'rgba(37,99,235,0.15)', color: '#60a5fa' }}>Pro</span>
  }
  if (status === 'trialing') {
    const daysLeft = sub.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86_400_000))
      : 0
    return <span style={{ ...badgeBase, background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>Trial {daysLeft}d</span>
  }
  if (status === 'past_due') {
    return <span style={{ ...badgeBase, background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>Past Due</span>
  }
  if (status === 'canceled' || status === 'expired') {
    return <span style={{ ...badgeBase, background: 'rgba(239,68,68,0.08)', color: '#888' }}>Expired</span>
  }
  return <span style={{ ...badgeBase, background: '#1e1e2e', color: '#666' }}>Free</span>
}

const badgeBase: React.CSSProperties = {
  display: 'inline-block', padding: '2px 8px', borderRadius: 9999,
  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em',
  textTransform: 'uppercase', whiteSpace: 'nowrap',
}
