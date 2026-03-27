'use client'

// hooks/useOrg.ts
// React hook that resolves the current organization ID.
// Wraps lib/org.ts getOrganizationId() with loading + error state.
// Use this in client components instead of calling getOrganizationId() manually.
//
// Usage:
//   const { orgId, loading, error } = useOrg()

import { useEffect, useState } from 'react'
import { getOrganizationId }   from '@/lib/org'

export interface UseOrgResult {
  orgId:   string | null
  loading: boolean
  error:   Error  | null
}

export function useOrg(): UseOrgResult {
  const [orgId,   setOrgId]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    getOrganizationId()
      .then((id) => {
        if (!cancelled) { setOrgId(id); setLoading(false) }
      })
      .catch((err) => {
        if (!cancelled) { setError(err instanceof Error ? err : new Error(String(err))); setLoading(false) }
      })

    return () => { cancelled = true }
  }, [])

  return { orgId, loading, error }
}
