// lib/subscription-server.ts
// Server-only subscription fetcher — uses next/headers via supabase-server.
// Do NOT import from 'use client' components.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { computePlanAccess }          from '@/lib/subscription'
import type { PlanAccess, Subscription } from '@/lib/subscription'

export async function getOrgPlanAccess(orgId: string): Promise<PlanAccess> {
  const supabase = createServerSupabaseClient()

  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('organization_id', orgId)
    .single()

  return computePlanAccess((data as Subscription) ?? null)
}
