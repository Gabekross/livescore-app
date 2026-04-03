'use client'

// components/admin/UpgradePrompt.tsx
// Dynamic trial/upgrade banner — changes messaging based on trial lifecycle.
// 5 states: early trial, mid trial, final days, last day, expired.

import { useAdminOrg } from '@/contexts/AdminOrgContext'
import { PRO_PLAN }    from '@/config/pricing'

interface UpgradePromptProps {
  message?: string
}

export default function UpgradePrompt({ message }: UpgradePromptProps) {
  const { plan } = useAdminOrg()
  if (!plan) return null

  const { effectivePlan, isTrialing, trialDaysLeft, needsUpgrade } = plan

  if (effectivePlan === 'pro') return null

  let text: string
  let ctaText: string
  let urgency: 'info' | 'warning' | 'danger'

  if (needsUpgrade) {
    // ── Expired
    text = message ?? 'Your trial has ended. Upgrade to keep managing your league with full access.'
    ctaText = PRO_PLAN.cta
    urgency = 'danger'
  } else if (isTrialing && trialDaysLeft === 0) {
    // ── Last day
    text = message ?? 'Your trial ends today. Upgrade now so your league never misses a beat.'
    ctaText = 'Unlock Full Control'
    urgency = 'danger'
  } else if (isTrialing && trialDaysLeft <= 2) {
    // ── Final days (1-2 days)
    text = message ?? `Only ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left in your trial. Upgrade to keep everything running smoothly.`
    ctaText = 'Upgrade Now'
    urgency = 'warning'
  } else if (isTrialing && trialDaysLeft <= 4) {
    // ── Mid trial (3-4 days)
    text = message ?? `${trialDaysLeft} days left to explore. Ready to unlock unlimited teams, media, and more?`
    ctaText = 'See Pro Features'
    urgency = 'info'
  } else if (isTrialing) {
    // ── Early trial (5+ days)
    text = message ?? `Free trial active — ${trialDaysLeft} days left. You have full access to explore.`
    ctaText = 'View Plans'
    urgency = 'info'
  } else {
    return null
  }

  const bg = urgency === 'danger'
    ? 'rgba(239,68,68,0.1)'
    : urgency === 'warning'
      ? 'rgba(251,191,36,0.1)'
      : 'rgba(37,99,235,0.08)'

  const borderColor = urgency === 'danger'
    ? 'rgba(239,68,68,0.3)'
    : urgency === 'warning'
      ? 'rgba(251,191,36,0.3)'
      : 'rgba(37,99,235,0.2)'

  const textColor = urgency === 'danger'
    ? '#f87171'
    : urgency === 'warning'
      ? '#fbbf24'
      : 'var(--color-text-muted, #7272a0)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '1rem', flexWrap: 'wrap',
      padding: '0.75rem 1.25rem', borderRadius: 12,
      background: bg, border: `1px solid ${borderColor}`,
      marginBottom: '1.25rem',
    }}>
      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: textColor }}>
        {text}
      </p>
      <a href="/admin/settings?tab=billing" style={{
        display: 'inline-block', padding: '0.4rem 1rem',
        background: urgency === 'danger' ? '#ef4444' : '#2563eb',
        color: '#fff', borderRadius: 8,
        fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}>
        {ctaText}
      </a>
    </div>
  )
}
