// lib/stripe.ts
// Stripe server-side client — initialized lazily from env vars.
// Price IDs are sourced from config/pricing.ts (single source of truth).

import Stripe from 'stripe'
import { PRO_TIERS, getTierByInterval } from '@/config/pricing'
import type { BillingInterval } from '@/config/pricing'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(key, { apiVersion: '2025-03-31.basil' })
  }
  return _stripe
}

// Legacy export for backwards compat — now delegates to config
export const STRIPE_PRICES = {
  pro_weekly:  PRO_TIERS[0]?.stripePriceId || '',
  pro_monthly: PRO_TIERS[1]?.stripePriceId || '',
  pro_yearly:  PRO_TIERS[2]?.stripePriceId || '',
}

// Get Stripe price ID by billing interval from centralized config
export function getStripePriceId(interval: BillingInterval): string {
  const tier = getTierByInterval(interval)
  return tier?.stripePriceId || ''
}
