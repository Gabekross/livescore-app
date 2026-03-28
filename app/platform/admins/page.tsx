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
                  color: admin.role === 'power_admin' ? '#fbbf24' : '#818cf8',
                }}
              >
                <option value="power_admin">Platform Admin</option>
                <option value="org_admin">Org Admin</option>
              </select>

              {admin.role === 'org_admin' && (
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
