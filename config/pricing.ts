// config/pricing.ts
// ─── Single source of truth for all pricing display values ────────────────────
// ALL prices and limits are driven by environment variables.
// There are NO hardcoded fallback prices — if an env var is missing the value
// will be 0 / empty so it is obvious in the UI that something is not configured.
//
// Required environment variables (set in .env.local AND Vercel):
//   NEXT_PUBLIC_PRICE_PRO_WEEKLY=42.00        ← displayed in UI
//   NEXT_PUBLIC_PRICE_PRO_MONTHLY=126.99
//   NEXT_PUBLIC_PRICE_PRO_YEARLY=999.00
//   NEXT_PUBLIC_TRIAL_DAYS=7
//   NEXT_PUBLIC_FREE_TEAM_LIMIT=4
//
// Stripe price IDs (server-side only — set in Vercel, NOT needed client-side):
//   STRIPE_PRICE_PRO_WEEKLY=price_xxx
//   STRIPE_PRICE_PRO_MONTHLY=price_xxx
//   STRIPE_PRICE_PRO_YEARLY=price_xxx

export type BillingInterval = 'week' | 'month' | 'year'

export interface PricingTier {
  interval:  BillingInterval
  label:     string
  price:     number
  currency:  string
  badge?:    string
  savings?:  string
  // Note: Stripe price IDs are server-only — read via getStripePriceId() in lib/stripe.ts
}

// ── Parse env helpers (safe for client + server) ──────────────────────────────
function envNum(key: string, fallback: number): number {
  const val = typeof process !== 'undefined' ? process.env[key] : undefined
  if (val === undefined || val === '') return fallback
  const n = parseFloat(val)
  return isNaN(n) ? fallback : n
}

// ── Prices from env — NO hardcoded fallbacks ──────────────────────────────────
// NEXT_PUBLIC_ prefix makes them available in the browser bundle at build time.
// Set these in Vercel → Settings → Environment Variables before each deploy.
const PRICE_WEEKLY  = envNum('NEXT_PUBLIC_PRICE_PRO_WEEKLY',  0)
const PRICE_MONTHLY = envNum('NEXT_PUBLIC_PRICE_PRO_MONTHLY', 0)
const PRICE_YEARLY  = envNum('NEXT_PUBLIC_PRICE_PRO_YEARLY',  0)

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
    interval: 'week',
    label:    'Weekly',
    price:    PRICE_WEEKLY,
    currency: 'USD',
  },
  {
    interval: 'month',
    label:    'Monthly',
    price:    PRICE_MONTHLY,
    currency: 'USD',
    badge:    'Most Popular',
  },
  {
    interval: 'year',
    label:    'Yearly',
    price:    PRICE_YEARLY,
    currency: 'USD',
    badge:    'Best Value',
    savings:  computeSavings(),
  },
]

// ── Basic (trial) plan constants ──────────────────────────────────────────────
export const FREE_PLAN = {
  name:      'Basic',
  trialDays: envNum('NEXT_PUBLIC_TRIAL_DAYS', 7),
  teamLimit: envNum('NEXT_PUBLIC_FREE_TEAM_LIMIT', 4),
  tagline:   'Everything you need to get started',
  cta:       'Start Basic Trial',
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
  { name: 'Tournaments & Competitions',   free: 'Yes',   pro: 'Yes'  },
  { name: 'Live Scores & Fixtures',       free: 'Yes',   pro: 'Yes'  },
  { name: 'Standings & Tables',           free: 'Yes',   pro: 'Yes'  },
  { name: 'News & Article Publishing',    free: 'No',    pro: 'Yes'  },
  { name: 'Media Library',                free: 'No',    pro: 'Yes'  },
  { name: 'Match Operator Accounts',      free: 'No',    pro: 'Yes'  },
  { name: 'Advanced Branding & Settings', free: 'Basic', pro: 'Full' },
  { name: 'Priority Support',             free: 'No',    pro: 'Yes'  },
]

// ── Value-driven feature descriptions (for marketing) ─────────────────────────
export const PRO_VALUE_FEATURES = [
  { title: 'Unlimited teams & tournaments',  text: 'Run leagues of any size without limits' },
  { title: 'News & media publishing',         text: 'Keep your audience engaged with articles, photos, and updates' },
  { title: 'Real-time match operators',        text: 'Let your team manage live scores from any device on match day' },
  { title: 'Advanced branding',                text: 'Fully customize your site to match your organization\'s identity' },
  { title: 'Priority support',                 text: 'Get help fast when you need it most' },
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
