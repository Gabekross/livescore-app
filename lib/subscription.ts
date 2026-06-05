// lib/subscription.ts
// Shared subscription types and plan computation — safe for client AND server.
// For server-side data fetching, use lib/subscription-server.ts instead.

import { FREE_PLAN } from '@/config/pricing'

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
  // True when user cancelled via portal but access continues until period end
  cancel_at_period_end:   boolean
  created_at:             string
  updated_at:             string
}

export interface PlanAccess {
  effectivePlan:        EffectivePlan
  subscription:         Subscription | null
  isTrialing:           boolean
  trialDaysLeft:        number
  teamLimit:            number
  canPublishNews:       boolean
  canManageMedia:       boolean
  canUseOperators:      boolean
  canCustomBrand:       boolean
  needsUpgrade:         boolean   // true when expired or at limit
  pendingCancel:        boolean   // true when cancel_at_period_end = true
  billingExempt?:       boolean   // true when role bypasses subscription gates
}

/* ── Feature matrix ─────────────────────────────────────────── */

function buildAccess(sub: Subscription | null): PlanAccess {
  const effective = computeEffectivePlan(sub)

  // Trialing: trial is active (not expired)
  const isTrialing = sub?.status === 'trialing' && effective !== 'expired'

  const trialDaysLeft = isTrialing && sub
    ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    : 0

  // Pro access = active pro OR active trial OR past_due grace period
  const isPro     = effective === 'pro'
  const isExpired = effective === 'expired'

  // Team limit: single source of truth from config/pricing.ts env var
  const teamLimit = isPro ? Infinity : FREE_PLAN.teamLimit

  return {
    effectivePlan:   effective,
    subscription:    sub,
    isTrialing,
    trialDaysLeft,
    teamLimit,
    canPublishNews:  isPro,
    canManageMedia:  isPro,
    canUseOperators: isPro,
    canCustomBrand:  isPro,
    needsUpgrade:    isExpired,
    pendingCancel:   sub?.cancel_at_period_end ?? false,
  }
}

/* ── Effective plan computation ──────────────────────────────── */

function computeEffectivePlan(sub: Subscription | null): EffectivePlan {
  if (!sub) return 'free'

  // Active pro (including cancel_at_period_end — still active until period ends)
  if (sub.plan === 'pro' && sub.status === 'active') return 'pro'

  // Past due: Stripe is retrying payment — keep Pro during grace period
  if (sub.plan === 'pro' && sub.status === 'past_due') return 'pro'

  // Trialing — give full Pro access during trial so users can evaluate features
  if (sub.status === 'trialing') {
    return new Date(sub.trial_ends_at) >= new Date() ? 'pro' : 'expired'
  }

  // Canceled / expired
  if (['canceled', 'expired'].includes(sub.status)) return 'expired'

  return 'free'
}

/* ── Client-compatible pure function (no DB call) ────────────── */

export function computePlanAccess(sub: Subscription | null): PlanAccess {
  return buildAccess(sub)
}

export function applyBillingExemption(access: PlanAccess | null): PlanAccess {
  const base = access ?? buildAccess(null)

  return {
    ...base,
    effectivePlan:   'pro',
    isTrialing:      false,
    trialDaysLeft:   0,
    teamLimit:       Infinity,
    canPublishNews:  true,
    canManageMedia:  true,
    canUseOperators: true,
    canCustomBrand:  true,
    needsUpgrade:    false,
    billingExempt:   true,
  }
}
