'use client'

// components/admin/PlanBadge.tsx
// Small inline badge showing current plan status.

import { useAdminOrg } from '@/contexts/AdminOrgContext'

const BADGE_STYLES: Record<string, React.CSSProperties> = {
  pro: {
    background: 'rgba(37,99,235,0.15)', color: '#60a5fa',
    border: '1px solid rgba(37,99,235,0.3)',
  },
  free: {
    background: 'rgba(34,197,94,0.12)', color: '#4ade80',
    border: '1px solid rgba(34,197,94,0.25)',
  },
  expired: {
    background: 'rgba(239,68,68,0.12)', color: '#f87171',
    border: '1px solid rgba(239,68,68,0.25)',
  },
  trialing: {
    background: 'rgba(251,191,36,0.12)', color: '#fbbf24',
    border: '1px solid rgba(251,191,36,0.25)',
  },
}

const BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.3em',
  padding: '2px 8px', borderRadius: 9999,
  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em',
  textTransform: 'uppercase' as const, lineHeight: 1.6, whiteSpace: 'nowrap' as const,
}

export default function PlanBadge() {
  const { plan } = useAdminOrg()
  if (!plan) return null

  const { effectivePlan, isTrialing, trialDaysLeft } = plan

  let label: string
  let variant: string

  if (effectivePlan === 'pro') {
    label = 'Pro'
    variant = 'pro'
  } else if (isTrialing) {
    label = `Trial · ${trialDaysLeft}d left`
    variant = 'trialing'
  } else if (effectivePlan === 'expired') {
    label = 'Expired'
    variant = 'expired'
  } else {
    label = 'Free'
    variant = 'free'
  }

  return (
    <span style={{ ...BASE, ...BADGE_STYLES[variant] }}>
      {label}
    </span>
  )
}
