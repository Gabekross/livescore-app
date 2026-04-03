// config/pricing.ts
// ─── Single source of truth for all pricing values ───────────────────────────
// UI components, checkout, and Stripe integration all read from here.
// To change pricing: update this file OR set env variables.

export type BillingInterval = 'week' | 'month' | 'year'

export interface PricingTier {
  interval:     BillingInterval
  label:        string
  price:        number          // display price
  currency:     string
  badge?:       string          // e.g. "Most Popular", "Best Value"
  savings?:     string          // e.g. "Save 33%"
  stripePriceId: string         // from env
}

// ── Pro plan pricing tiers ────────────────────────────────────────────────────
export const PRO_TIERS: PricingTier[] = [
  {
    interval:      'week',
    label:         'Weekly',
    price:         4.99,
    currency:      'USD',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_WEEKLY  || process.env.STRIPE_PRICE_PRO_WEEKLY  || '',
  },
  {
    interval:      'month',
    label:         'Monthly',
    price:         14.99,
    currency:      'USD',
    badge:         'Most Popular',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || process.env.STRIPE_PRICE_PRO_MONTHLY || '',
  },
  {
    interval:      'year',
    label:         'Yearly',
    price:         120,
    currency:      'USD',
    badge:         'Best Value',
    savings:       'Save 33%',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY  || process.env.STRIPE_PRICE_PRO_YEARLY  || '',
  },
]

// ── Free plan constants ───────────────────────────────────────────────────────
export const FREE_PLAN = {
  name:          'Free Trial',
  trialDays:     7,
  teamLimit:     8,
  tagline:       'Everything you need to get started',
  cta:           'Start Free Trial',
}

// ── Pro plan display info ─────────────────────────────────────────────────────
export const PRO_PLAN = {
  name:     'Pro',
  tagline:  'Run your league like a pro',
  cta:      'Upgrade Your League',
}

// ── Feature comparison ────────────────────────────────────────────────────────
export interface PlanFeature {
  name:     string
  free:     string
  pro:      string
}

export const PLAN_FEATURES: PlanFeature[] = [
  { name: 'Teams',                          free: 'Up to 8',  pro: 'Unlimited' },
  { name: 'Tournaments & Competitions',     free: '✓',        pro: '✓' },
  { name: 'Live Scores & Fixtures',         free: '✓',        pro: '✓' },
  { name: 'Standings & Tables',             free: '✓',        pro: '✓' },
  { name: 'News & Article Publishing',      free: '—',        pro: '✓' },
  { name: 'Media Library',                  free: '—',        pro: '✓' },
  { name: 'Match Operator Accounts',        free: '—',        pro: '✓' },
  { name: 'Advanced Branding & Settings',   free: 'Basic',    pro: 'Full' },
  { name: 'Priority Support',               free: '—',        pro: '✓' },
]

// ── Value-driven feature descriptions (for marketing) ─────────────────────────
export const PRO_VALUE_FEATURES = [
  { icon: '🏟️', title: 'Unlimited teams & tournaments',  text: 'Run leagues of any size without limits' },
  { icon: '📰', title: 'News & media publishing',         text: 'Keep your audience engaged with articles, photos, and updates' },
  { icon: '⚡', title: 'Real-time match operators',        text: 'Let your team manage live scores from any device on match day' },
  { icon: '🎨', title: 'Advanced branding',                text: 'Fully customize your site to match your organization\'s identity' },
  { icon: '🛡️', title: 'Priority support',                 text: 'Get help fast when you need it most' },
]

// ── Helper: format price for display ──────────────────────────────────────────
export function formatPrice(price: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency,
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price)
}

// ── Helper: get default (most popular) tier ───────────────────────────────────
export function getDefaultTier(): PricingTier {
  return PRO_TIERS.find(t => t.badge === 'Most Popular') || PRO_TIERS[1]
}

// ── Helper: get tier by interval ──────────────────────────────────────────────
export function getTierByInterval(interval: BillingInterval): PricingTier | undefined {
  return PRO_TIERS.find(t => t.interval === interval)
}
