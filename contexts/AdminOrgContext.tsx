'use client'

// contexts/AdminOrgContext.tsx
// Provides the current organization ID and admin role to all admin pages.
//
// Resolution strategy:
//   1. Primary: resolve via NEXT_PUBLIC_ORGANIZATION_SLUG env var (fast, works for all)
//   2. Fallback: if primary fails and user is authenticated, resolve org from
//      their admin_profiles.organization_id (handles auth-timing edge cases)
//   3. Also fetches admin role (power_admin | org_admin) for role-aware UX
//
// Usage:
//   const { orgId, role, loading, error, retry } = useAdminOrg()

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type AdminRole = 'power_admin' | 'org_admin' | null

interface AdminOrgContextValue {
  orgId:   string | null
  role:    AdminRole
  orgName: string | null
  loading: boolean
  error:   Error  | null
  retry:   () => void
}

const AdminOrgContext = createContext<AdminOrgContextValue>({
  orgId: null, role: null, orgName: null, loading: true, error: null, retry: () => {},
})

export function AdminOrgProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AdminOrgContextValue, 'retry'>>({
    orgId: null, role: null, orgName: null, loading: true, error: null,
  })

  const resolve = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    // ── Step 1: Fetch admin profile (role + assigned org) ───────────────
    let role: AdminRole = null
    let profileOrgId: string | null = null

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('admin_profiles')
          .select('role, organization_id')
          .eq('id', user.id)
          .single()

        if (profile) {
          role = (profile.role as AdminRole) || null
          profileOrgId = profile.organization_id || null
        }
      }
    } catch {
      // Auth not ready yet — will fall through to slug-based resolution
    }

    // ── Step 2: Resolve organization ID ─────────────────────────────────
    let orgId: string | null = null
    let orgName: string | null = null
    let lastError: Error | null = null

    // Strategy A: env-var slug resolution (works for single-org deployments)
    const slug = process.env.NEXT_PUBLIC_ORGANIZATION_SLUG
    if (slug) {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('slug', slug)
          .single()

        if (!error && data) {
          orgId = data.id
          orgName = data.name
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
      }
    }

    // Strategy B: profile-based fallback (org_admin with assigned org)
    if (!orgId && profileOrgId) {
      try {
        const { data } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', profileOrgId)
          .single()

        if (data) {
          orgId = data.id
          orgName = data.name
          lastError = null // clear error since we recovered
        }
      } catch {
        // Both strategies failed
      }
    }

    // Strategy C: power_admin with no specific org — pick the first one
    if (!orgId && role === 'power_admin') {
      try {
        const { data } = await supabase
          .from('organizations')
          .select('id, name')
          .order('name')
          .limit(1)
          .single()

        if (data) {
          orgId = data.id
          orgName = data.name
          lastError = null
        }
      } catch {
        // No organizations exist yet
      }
    }

    if (!orgId && !lastError) {
      lastError = new Error(
        'Could not determine organization. ' +
        (slug ? `No organization with slug "${slug}" found.` : 'NEXT_PUBLIC_ORGANIZATION_SLUG is not set.') +
        (role === 'org_admin' && !profileOrgId ? ' Your admin profile has no assigned organization.' : '')
      )
    }

    setState({ orgId, role, orgName, loading: false, error: lastError })
  }, [])

  useEffect(() => { resolve() }, [resolve])

  const contextValue: AdminOrgContextValue = {
    ...state,
    retry: resolve,
  }

  return (
    <AdminOrgContext.Provider value={contextValue}>
      {children}
    </AdminOrgContext.Provider>
  )
}

export function useAdminOrg(): AdminOrgContextValue {
  return useContext(AdminOrgContext)
}
