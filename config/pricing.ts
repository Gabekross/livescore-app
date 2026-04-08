// config/pricing.ts
// ─── Single source of truth for all pricing values ───────────────────────────
// Prices are read from environment variables so you can change them without
// redeploying code. Hardcoded values below are ONLY fallback defaults.
//
// Environment variables (set in .env.local or Vercel):
//   NEXT_PUBLIC_PRICE_PRO_WEEKLY=4.99
//   NEXT_PUBLIC_PRICE_PRO_MONTHLY=14.99
//   NEXT_PUBLIC_PRICE_PRO_YEARLY=120
//   NEXT_PUBLIC_TRIAL_DAYS=7
//   NEXT_PUBLIC_FREE_TEAM_LIMIT=8
//
// Stripe price IDs (server-side):
//   STRIPE_PRICE_PRO_WEEKLY=price_xxx
//   STRIPE_PRICE_PRO_MONTHLY=price_xxx
//   STRIPE_PRICE_PRO_YEARLY=price_xxx

export type BillingInterval = 'week' | 'month' | 'year'

export interface PricingTier {
  interval:      BillingInterval
  label:         string
  price:         number
  currency:      string
  badge?:        string
  savings?:      string
  stripePriceId: string
}

// ── Parse env helpers (safe for client + server) ──────────────────────────────
function envNum(key: string, fallback: number): number {
  const val = typeof process !== 'undefined' ? process.env[key] : undefined
  if (val === undefined || val === '') return fallback
  const n = parseFloat(val)
  return isNaN(n) ? fallback : n
}

function envStr(key: string, fallback: string): string {
  const val = typeof process !== 'undefined' ? process.env[key] : undefined
  return val || fallback
}

// ── Prices from env (NEXT_PUBLIC_ prefix so they're available client-side) ────
const PRICE_WEEKLY  = envNum('NEXT_PUBLIC_PRICE_PRO_WEEKLY',  4.99)
const PRICE_MONTHLY = envNum('NEXT_PUBLIC_PRICE_PRO_MONTHLY', 14.99)
const PRICE_YEARLY  = envNum('NEXT_PUBLIC_PRICE_PRO_YEARLY',  120)

// ── Compute savings dynamically ───────────────────────────────────────────────
function computeSavings(): string {
  const monthlyAnnualized = PRICE_MONTHLY * 12
  if (monthlyAnnualized <= 0) return ''
  const pct = Math.round(((monthlyAnnualized - PRICE_YEARLY) / monthlyAnnualized) * 100)
  return pct > 0 ? `Save ${pct}%` : ''
}

// ── Pro plan pricing tiers ────────────────────────────────────────────────────
export const PRO_TIERS: PricingTier[] = [
  {
    interval:      'week',
    label:         'Weekly',
    price:         PRICE_WEEKLY,
    currency:      'USD',
    stripePriceId: envStr('NEXT_PUBLIC_STRIPE_PRICE_PRO_WEEKLY', '') || envStr('STRIPE_PRICE_PRO_WEEKLY', ''),
  },
  {
    interval:      'month',
    label:         'Monthly',
    price:         PRICE_MONTHLY,
    currency:      'USD',
    badge:         'Most Popular',
    stripePriceId: envStr('NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY', '') || envStr('STRIPE_PRICE_PRO_MONTHLY', ''),
  },
  {
    interval:      'year',
    label:         'Yearly',
    price:         PRICE_YEARLY,
    currency:      'USD',
    badge:         'Best Value',
    savings:       computeSavings(),
    stripePriceId: envStr('NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY', '') || envStr('STRIPE_PRICE_PRO_YEARLY', ''),
  },
]

// ── Free plan constants ───────────────────────────────────────────────────────
export const FREE_PLAN = {
  name:      'Free Trial',
  trialDays: envNum('NEXT_PUBLIC_TRIAL_DAYS', 7),
  teamLimit: envNum('NEXT_PUBLIC_FREE_TEAM_LIMIT', 8),
  tagline:   'Everything you need to get started',
  cta:       'Start Free Trial',
}

// ── Pro plan display info ─────────────────────────────────────────────────────
export const PRO_PLAN = {
  name:    'Pro',
  tagline: 'Run your league like a pro',
  cta:     'Upgrade Your League',
}

// ── Feature comparison ────────────────────────────────────────────────────────
export interface PlanFeature {
  name: string
  free: string
  pro:  string
}

export const PLAN_FEATURES: PlanFeature[] = [
  { name: 'Teams',                        free: `Up to ${FREE_PLAN.teamLimit}`, pro: 'Unlimited' },
  { name: 'Tournaments & Competitions',   free: '✓',     pro: '✓' },
  { name: 'Live Scores & Fixtures',       free: '✓',     pro: '✓' },
  { name: 'Standings & Tables',           free: '✓',     pro: '✓' },
  { name: 'News & Article Publishing',    free: '—',     pro: '✓' },
  { name: 'Media Library',                free: '—',     pro: '✓' },
  { name: 'Match Operator Accounts',      free: '—',     pro: '✓' },
  { name: 'Advanced Branding & Settings', free: 'Basic', pro: 'Full' },
  { name: 'Priority Support',             free: '—',     pro: '✓' },
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
