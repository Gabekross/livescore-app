// lib/subscription.ts
// Shared subscription types and plan computation — safe for client AND server.
// For server-side data fetching, use lib/subscription-server.ts instead.

/* ── Types ──────────────────────────────────────────────────── */

export type PlanTier = 'free' | 'pro'
export type EffectivePlan = 'free' | 'pro' | 'expired'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'

export interface Subscription {
  id:                     string
  organization_id:        string
  plan:                   PlanTier
  status:                 SubscriptionStatus
  billing_interval:       'week' | 'month' | 'year' | null
  trial_starts_at:        string
  trial_ends_at:          string
  current_period_start:   string | null
  current_period_end:     string | null
  stripe_customer_id:     string | null
  stripe_subscription_id: string | null
  canceled_at:            string | null
  created_at:             string
  updated_at:             string
}

export interface PlanAccess {
  effectivePlan:     EffectivePlan
  subscription:      Subscription | null
  isTrialing:        boolean
  trialDaysLeft:     number
  teamLimit:         number          // 8 for free, Infinity for pro
  canPublishNews:    boolean
  canManageMedia:    boolean
  canUseOperators:   boolean
  canCustomBrand:    boolean
  needsUpgrade:      boolean         // true when expired or at limit
}

/* ── Feature matrix ─────────────────────────────────────────── */

const FREE_TEAM_LIMIT = 8

function buildAccess(sub: Subscription | null): PlanAccess {
  const effective = computeEffectivePlan(sub)
  const isTrialing = sub?.status === 'trialing' && effective !== 'expired'
  const trialDaysLeft = isTrialing && sub
    ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    : 0

  const isPro = effective === 'pro'
  const isExpired = effective === 'expired'

  return {
    effectivePlan:  effective,
    subscription:   sub,
    isTrialing,
    trialDaysLeft,
    teamLimit:      isPro ? Infinity : FREE_TEAM_LIMIT,
    canPublishNews: isPro,
    canManageMedia: isPro,
    canUseOperators: isPro,
    canCustomBrand: isPro,
    needsUpgrade:   isExpired,
  }
}

/* ── Effective plan computation ──────────────────────────────── */

function computeEffectivePlan(sub: Subscription | null): EffectivePlan {
  if (!sub) return 'free'

  // Active pro
  if (sub.plan === 'pro' && sub.status === 'active') return 'pro'

  // Trialing — check if trial still valid
  if (sub.status === 'trialing') {
    return new Date(sub.trial_ends_at) >= new Date() ? 'free' : 'expired'
  }

  // Past due, canceled, expired
  if (['past_due', 'canceled', 'expired'].includes(sub.status)) return 'expired'

  return 'free'
}

/* ── Client-compatible pure function (no DB call) ────────────── */

export function computePlanAccess(sub: Subscription | null): PlanAccess {
  return buildAccess(sub)
}
