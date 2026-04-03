'use client'

// hooks/useTeamLimit.ts
// Returns whether the org can add more teams based on their plan.

import { useAdminOrg } from '@/contexts/AdminOrgContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface TeamLimitState {
  teamCount: number
  teamLimit: number
  canAddTeam: boolean
  loading:    boolean
}

export function useTeamLimit(): TeamLimitState {
  const { orgId, plan } = useAdminOrg()
  const [teamCount, setTeamCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) return
    let cancelled = false

    ;(async () => {
      const { count } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)

      if (!cancelled) {
        setTeamCount(count ?? 0)
        setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [orgId])

  const teamLimit = plan?.teamLimit ?? 8
  const canAddTeam = teamCount < teamLimit

  return { teamCount, teamLimit, canAddTeam, loading }
}
