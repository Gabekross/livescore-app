'use client'

// contexts/AdminOrgContext.tsx
// Provides the current organization ID to all admin pages.
// Loaded once when the admin layout mounts; cached for all child routes.
//
// Usage in admin pages:
//   const { orgId, loading, error } = useAdminOrg()
//
// This replaces the fragmented pattern of each page independently calling
// useOrg() or getOrganizationId(), which caused race conditions and the
// "organization not loaded" error on form submissions.

import { createContext, useContext, useEffect, useState } from 'react'
import { getOrganizationId } from '@/lib/org'

interface AdminOrgContextValue {
  orgId:   string | null
  loading: boolean
  error:   Error  | null
}

const AdminOrgContext = createContext<AdminOrgContextValue>({
  orgId: null, loading: true, error: null,
})

export function AdminOrgProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdminOrgContextValue>({
    orgId: null, loading: true, error: null,
  })

  useEffect(() => {
    let cancelled = false

    getOrganizationId()
      .then((id) => {
        if (!cancelled) setState({ orgId: id, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({
          orgId: null, loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        })
      })

    return () => { cancelled = true }
  }, [])

  return (
    <AdminOrgContext.Provider value={state}>
      {children}
    </AdminOrgContext.Provider>
  )
}

export function useAdminOrg(): AdminOrgContextValue {
  return useContext(AdminOrgContext)
}
