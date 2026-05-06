// lib/stripe.ts
// Stripe server-side client — initialized lazily from env vars.
// Price IDs are sourced from config/pricing.ts (single source of truth).

import Stripe from 'stripe'
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

// Read price IDs from env at call-time — never from a module-level cache.
// This prevents stale values if the module was initialized before env vars
// were injected (e.g. during Next.js build-time SSG passes).
export function getStripePriceId(interval: BillingInterval): string {
  const map: Record<BillingInterval, string> = {
    week:  process.env.STRIPE_PRICE_PRO_WEEKLY  || '',
    month: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    year:  process.env.STRIPE_PRICE_PRO_YEARLY  || '',
  }
  return map[interval] || ''
}
