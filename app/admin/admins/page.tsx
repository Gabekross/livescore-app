'use client'

// app/admin/admins/page.tsx
// Power admin: view admin users and their org assignments.
// Note: Creating admin users requires the Supabase Auth dashboard (email/password).
// This page manages the admin_profiles table (role + org assignment).

import { useEffect, useState, useCallback } from 'react'
import { supabase }            from '@/lib/supabase'
import { useAdminOrg }         from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }     from '@/components/admin/AdminOrgGate'
import toast                   from 'react-hot-toast'

interface AdminProfile {
  id:              string
  role:            string
  organization_id: string | null
  created_at:      string
  organization?:   { name: string } | null
}

interface Organization {
  id:   string
  name: string
}

export default function AdminUsersPage() {
  const { role: myRole } = useAdminOrg()
  const orgGate = useAdminOrgGate()

  const [admins, setAdmins] = useState<AdminProfile[]>([])
  const [orgs, setOrgs]     = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const [adminsRes, orgsRes] = await Promise.all([
      supabase
        .from('admin_profiles')
        .select('id, role, organization_id, created_at, organization:organization_id(name)')
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

  if (orgGate) return orgGate

  if (myRole !== 'power_admin') {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#6b7280' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p>Only platform administrators can manage admin users.</p>
      </div>
    )
  }

  const handleRoleChange = async (profileId: string, newRole: string, orgId: string | null) => {
    const payload: Record<string, unknown> = {
      role: newRole,
      organization_id: newRole === 'power_admin' ? null : orgId,
    }
    const { error } = await supabase.from('admin_profiles').update(payload).eq('id', profileId)
    if (error) {
      toast.error(`Update failed: ${error.message}`)
    } else {
      toast.success('Admin profile updated')
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
      toast.success('Organization assignment updated')
      fetchData()
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.25rem' }}>
        Admin Users
      </h1>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>
        Manage admin roles and organization assignments.
      </p>
      <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: '2rem', lineHeight: 1.5 }}>
        To add a new admin, first create a user in the Supabase Auth dashboard, then add their UUID to the admin_profiles table.
      </p>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading admin profiles...</p>
      ) : admins.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No admin profiles found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {admins.map((admin) => (
            <div
              key={admin.id}
              style={{
                background: '#fff', padding: '1rem 1.25rem', borderRadius: '10px',
                border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center',
                gap: '1rem', flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {admin.id}
                </div>
              </div>

              <select
                value={admin.role}
                onChange={(e) => handleRoleChange(admin.id, e.target.value, admin.organization_id)}
                style={{
                  padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '6px',
                  fontSize: '0.82rem', fontWeight: 600,
                  color: admin.role === 'power_admin' ? '#d97706' : '#2563eb',
                }}
              >
                <option value="power_admin">Platform Admin</option>
                <option value="org_admin">Org Admin</option>
              </select>

              {admin.role === 'org_admin' && (
                <select
                  value={admin.organization_id || ''}
                  onChange={(e) => handleOrgChange(admin.id, e.target.value)}
                  style={{
                    padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '6px',
                    fontSize: '0.82rem', minWidth: '160px',
                  }}
                >
                  <option value="">No org assigned</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              )}

              {admin.role === 'org_admin' && admin.organization && (
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                  {admin.organization.name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
