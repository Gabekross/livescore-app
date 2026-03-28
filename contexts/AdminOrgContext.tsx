'use client'

// contexts/AdminOrgContext.tsx
// Provides the current organization ID and admin role to all admin pages.
//
// Resolution strategy (3 strategies, tried in order):
//   1. Primary: resolve via NEXT_PUBLIC_ORGANIZATION_SLUG env var
//   2. Fallback B: resolve from admin_profiles.organization_id (org_admin)
//   3. Fallback C: power_admin picks first organization alphabetically
//
// Also fetches admin role (power_admin | org_admin) for role-aware UX.
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

    const diagnostics: string[] = []

    // ── Step 1: Get authenticated user ────────────────────────────────────
    let userId: string | null = null
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr) {
        diagnostics.push(`Auth error: ${authErr.message}`)
      } else if (user) {
        userId = user.id
      } else {
        diagnostics.push('No authenticated user found')
      }
    } catch (err) {
      diagnostics.push(`Auth exception: ${err instanceof Error ? err.message : String(err)}`)
    }

    // ── Step 2: Fetch admin profile (role + assigned org) ─────────────────
    let role: AdminRole = null
    let profileOrgId: string | null = null

    if (userId) {
      try {
        const { data: profile, error: profileErr } = await supabase
          .from('admin_profiles')
          .select('role, organization_id')
          .eq('id', userId)
          .single()

        if (profileErr) {
          diagnostics.push(`Profile query error: ${profileErr.message}`)
        } else if (profile) {
          role = (profile.role as AdminRole) || null
          profileOrgId = profile.organization_id || null
          diagnostics.push(`Profile found: role=${role}, hasOrgId=${!!profileOrgId}`)
        } else {
          diagnostics.push('No admin profile row returned')
        }
      } catch (err) {
        diagnostics.push(`Profile exception: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // ── Step 3: Resolve organization ID (3 strategies) ────────────────────
    let orgId: string | null = null
    let orgName: string | null = null

    // Strategy A: env-var slug resolution
    const slug = process.env.NEXT_PUBLIC_ORGANIZATION_SLUG
    if (slug) {
      try {
        const { data, error: slugErr } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('slug', slug)
          .single()

        if (slugErr) {
          diagnostics.push(`Strategy A (slug="${slug}"): ${slugErr.message}`)
        } else if (data) {
          orgId = data.id
          orgName = data.name
          diagnostics.push(`Strategy A resolved: ${data.name}`)
        }
      } catch (err) {
        diagnostics.push(`Strategy A exception: ${err instanceof Error ? err.message : String(err)}`)
      }
    } else {
      diagnostics.push('Strategy A skipped: NEXT_PUBLIC_ORGANIZATION_SLUG not set')
    }

    // Strategy B: profile-based fallback (org_admin with assigned org)
    if (!orgId && profileOrgId) {
      try {
        const { data, error: profOrgErr } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', profileOrgId)
          .single()

        if (profOrgErr) {
          diagnostics.push(`Strategy B: ${profOrgErr.message}`)
        } else if (data) {
          orgId = data.id
          orgName = data.name
          diagnostics.push(`Strategy B resolved: ${data.name}`)
        }
      } catch (err) {
        diagnostics.push(`Strategy B exception: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // Strategy C: power_admin picks first org (or any authenticated admin)
    if (!orgId && userId) {
      try {
        const { data, error: firstOrgErr } = await supabase
          .from('organizations')
          .select('id, name')
          .order('name')
          .limit(1)
          .single()

        if (firstOrgErr) {
          diagnostics.push(`Strategy C: ${firstOrgErr.message}`)
        } else if (data) {
          orgId = data.id
          orgName = data.name
          diagnostics.push(`Strategy C resolved: ${data.name}`)
        }
      } catch (err) {
        diagnostics.push(`Strategy C exception: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // ── Step 4: Build final state ─────────────────────────────────────────
    let finalError: Error | null = null

    if (!orgId) {
      // Build a user-friendly message with diagnostics for debugging
      const userMsg = !userId
        ? 'Not authenticated. Please sign in.'
        : 'Could not determine organization.'
      const debugInfo = diagnostics.length > 0
        ? ' [Debug: ' + diagnostics.join(' | ') + ']'
        : ''
      finalError = new Error(userMsg + debugInfo)
    }

    setState({ orgId, role, orgName, loading: false, error: finalError })
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
