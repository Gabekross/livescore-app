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

  const effectivePlan = plan?.effectivePlan ?? 'free'
  const isPro = effectivePlan === 'pro'
  const isExpired = effectivePlan === 'expired'
  const isFree = effectivePlan === 'free'
  const isTrialActive = plan?.isTrialing ?? false

  return {
    isTrialActive,
    isPro,
    isExpired,
    isFree,

    trialDaysLeft:  plan?.trialDaysLeft ?? 0,
    needsUpgrade:   plan?.needsUpgrade ?? false,

    canCreateTeam:  canAddTeam,
    teamCount,
    teamLimit,

    canUseFeature:  (feature: FeatureKey) => plan?.[feature] ?? false,

    canPublishNews:  plan?.canPublishNews ?? false,
    canManageMedia:  plan?.canManageMedia ?? false,
    canUseOperators: plan?.canUseOperators ?? false,
    canCustomBrand:  plan?.canCustomBrand ?? false,

    // Expired trials can view but not edit
    canEdit: !isExpired,

    loading: orgLoading || teamLoading,
    plan,
  }
}
