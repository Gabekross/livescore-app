'use client'

// hooks/usePlanAccess.ts
// ─── Centralized access control hook ─────────────────────────────────────────
// Single source of truth for plan-based permissions.
// DO NOT scatter plan logic across components — use this hook.
//
// Usage:
//   const { isTrialActive, isPro, isExpired, canCreateTeam, canUseFeature } = usePlanAccess()

import { useAdminOrg }    from '@/contexts/AdminOrgContext'
import { useTeamLimit }   from '@/hooks/useTeamLimit'
import { useDemoMode }    from '@/hooks/useDemoMode'
import type { PlanAccess } from '@/lib/subscription'

type FeatureKey = 'canPublishNews' | 'canManageMedia' | 'canUseOperators' | 'canCustomBrand'

interface PlanAccessHook {
  // ── Core plan states ──────────────────────
  isTrialActive:  boolean
  isPro:          boolean
  isExpired:      boolean
  isFree:         boolean

  // ── Trial info ────────────────────────────
  trialDaysLeft:  number
  needsUpgrade:   boolean

  // ── Team limit ────────────────────────────
  canCreateTeam:  boolean
  teamCount:      number
  teamLimit:      number

  // ── Feature access (dynamic) ──────────────
  canUseFeature:  (feature: FeatureKey) => boolean

  // ── Direct feature flags ──────────────────
  canPublishNews:  boolean
  canManageMedia:  boolean
  canUseOperators: boolean
  canCustomBrand:  boolean

  // ── Editing (blocked when expired) ────────
  canEdit:         boolean

  // ── Loading state ─────────────────────────
  loading:         boolean

  // ── Raw plan access object ────────────────
  plan:            PlanAccess | null
}

export function usePlanAccess(): PlanAccessHook {
  const { plan, loading: orgLoading } = useAdminOrg()
  const { canAddTeam, teamCount, teamLimit, loading: teamLoading } = useTeamLimit()
  const { treatAsPro }                = useDemoMode()

  const effectivePlan = plan?.effectivePlan ?? 'free'
  const isPro     = treatAsPro || effectivePlan === 'pro'
  const isExpired = !treatAsPro && effectivePlan === 'expired'
  const isFree    = !treatAsPro && effectivePlan === 'free'
  const isTrialActive = !treatAsPro && (plan?.isTrialing ?? false)

  return {
    isTrialActive,
    isPro,
    isExpired,
    isFree,

    trialDaysLeft:  treatAsPro ? 0 : (plan?.trialDaysLeft ?? 0),
    needsUpgrade:   treatAsPro ? false : (plan?.needsUpgrade ?? false),

    // In demo mode the team limit is removed for the UI so Free vs Pro
    // never surfaces. Server-side RLS is unchanged.
    canCreateTeam:  treatAsPro ? true : canAddTeam,
    teamCount,
    teamLimit:      treatAsPro ? Infinity : teamLimit,

    canUseFeature:  (feature: FeatureKey) => treatAsPro ? true : (plan?.[feature] ?? false),

    canPublishNews:  treatAsPro ? true : (plan?.canPublishNews ?? false),
    canManageMedia:  treatAsPro ? true : (plan?.canManageMedia ?? false),
    canUseOperators: treatAsPro ? true : (plan?.canUseOperators ?? false),
    canCustomBrand:  treatAsPro ? true : (plan?.canCustomBrand ?? false),

    // Expired trials can view but not edit (skipped in demo mode)
    canEdit: treatAsPro ? true : !isExpired,

    loading: orgLoading || teamLoading,
    plan,
  }
}
