'use client'

// app/platform/admins/page.tsx
// Power admin: manage admin users, roles, and org assignments.

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import toast        from 'react-hot-toast'

interface AdminProfile {
  id:              string
  role:            string
  full_name:       string | null
  organization_id: string | null
  created_at:      string
  organization?:   { name: string } | null
}

interface Organization {
  id:   string
  name: string
}

const ORG_SCOPED_ROLES = new Set(['org_admin', 'billing_exempt_admin', 'match_operator'])

export default function PlatformAdminsPage() {
  const [admins, setAdmins]   = useState<AdminProfile[]>([])
  const [orgs, setOrgs]       = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const [adminsRes, orgsRes] = await Promise.all([
      supabase
        .from('admin_profiles')
        .select('id, role, full_name, organization_id, created_at, organization:organization_id(name)')
        .order('created_at'),
      supabase
        .from('organizations')
        .select('id, name')
        .order('name'),
    ])
    setAdmins(((adminsRes.data || []) as unknown as AdminProfile[]).map((a) => ({
      ...a,
      organization: Array.isArray(a.organization) ? a.organization[0] : a.organization,
    })))
    setOrgs((orgsRes.data || []) as Organization[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRoleChange = async (profileId: string, newRole: string, orgId: string | null) => {
    if (ORG_SCOPED_ROLES.has(newRole) && !orgId) {
      toast.error('Assign an organization before using an org-scoped role.')
      return
    }

    const payload: Record<string, unknown> = {
      role: newRole,
      organization_id: newRole === 'power_admin' ? null : orgId,
    }
    const { error } = await supabase.from('admin_profiles').update(payload).eq('id', profileId)
    if (error) {
      toast.error(`Update failed: ${error.message}`)
    } else {
      toast.success('Profile updated')
      fetchData()
    }
  }

  const handleOrgChange = async (profileId: string, newOrgId: string) => {
    const { error } = await supabase
      .from('admin_profiles')
      .update({ organization_id: newOrgId || null })
      .eq('id', profileId)
    if (error) {
      toast.error(`Update failed: ${error.message}`)
    } else {
      toast.success('Org assignment updated')
      fetchData()
    }
  }

  const cardStyle: React.CSSProperties = {
    background: '#141420', border: '1px solid #1e1e2e', borderRadius: '10px',
    padding: '1rem 1.25rem',
  }

  const selectStyle: React.CSSProperties = {
    padding: '0.4rem 0.6rem',
    background: '#0a0a14', border: '1px solid #2a2a3e', borderRadius: '6px',
    color: '#c8c8e0', fontSize: '0.82rem', fontWeight: 600,
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f0ff', marginBottom: '0.25rem' }}>
        Admin Users
      </h1>
      <p style={{ fontSize: '0.85rem', color: '#8888aa', marginBottom: '2rem' }}>
        Manage admin roles and organization assignments. New admins are created when they sign up and create an organization.
      </p>

      <section style={{ ...cardStyle, marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.65rem' }}>
          Role Guide
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.65rem' }}>
          <RoleHelp title="Platform Admin" tone="#fbbf24" text="Full platform access. Can manage every organization, admin user, and platform setting." />
          <RoleHelp title="Org Admin" tone="#818cf8" text="Manages one assigned organization and follows that organization's subscription limits." />
          <RoleHelp title="Billing Exempt Admin" tone="#34d399" text="Manages one assigned organization with paid feature gates bypassed. Does not get platform access." />
          <RoleHelp title="Match Operator" tone="#f97316" text="Limited game-day role for updating matches from the operator screen only." />
        </div>
        <p style={{ fontSize: '0.76rem', color: '#777799', lineHeight: 1.5, margin: '0.8rem 0 0' }}>
          Org-scoped roles must have an organization assigned before the role can be saved.
        </p>
      </section>

      {loading ? (
        <p style={{ color: '#8888aa' }}>Loading...</p>
      ) : admins.length === 0 ? (
        <p style={{ color: '#8888aa' }}>No admin profiles found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {admins.map((admin) => (
            <div key={admin.id} style={{
              ...cardStyle, display: 'flex', alignItems: 'center',
              gap: '1rem', flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                {admin.full_name && (
                  <div style={{ fontWeight: 700, color: '#e8e8f0', fontSize: '0.88rem', marginBottom: '0.15rem' }}>
                    {admin.full_name}
                  </div>
                )}
                <div style={{ fontSize: '0.72rem', color: '#6666888', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {admin.id}
                </div>
              </div>

              <select
                value={admin.role}
                onChange={(e) => handleRoleChange(admin.id, e.target.value, admin.organization_id)}
                style={{
                  ...selectStyle,
                  color: admin.role === 'power_admin' ? '#fbbf24' : admin.role === 'billing_exempt_admin' ? '#34d399' : '#818cf8',
                }}
              >
                <option value="power_admin">Platform Admin</option>
                <option value="org_admin">Org Admin</option>
                <option value="billing_exempt_admin">Billing Exempt Admin</option>
              </select>

              {(admin.role === 'org_admin' || admin.role === 'billing_exempt_admin') && (
                <select
                  value={admin.organization_id || ''}
                  onChange={(e) => handleOrgChange(admin.id, e.target.value)}
                  style={{ ...selectStyle, minWidth: '160px' }}
                >
                  <option value="">No org assigned</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              )}

              <div style={{ fontSize: '0.72rem', color: '#555566' }}>
                {new Date(admin.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RoleHelp({ title, tone, text }: { title: string; tone: string; text: string }) {
  return (
    <div style={{ background: '#0f0f19', border: '1px solid #24243a', borderRadius: 8, padding: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.3rem' }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: tone, flexShrink: 0 }} />
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f0f0ff' }}>{title}</span>
      </div>
      <div style={{ fontSize: '0.76rem', color: '#8f8fb0', lineHeight: 1.45 }}>{text}</div>
    </div>
  )
}
