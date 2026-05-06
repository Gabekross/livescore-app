'use client'

// components/admin/BillingSection.tsx
// Billing & Plan section — plan display, usage, interval switching, cancel, reactivate.
// All pricing values sourced from config/pricing.ts env vars.

import { useState }                          from 'react'
import { useAdminOrg }                       from '@/contexts/AdminOrgContext'
import { useTeamLimit }                      from '@/hooks/useTeamLimit'
import PlanBadge                             from '@/components/admin/PlanBadge'
import UpgradeModal                          from '@/components/admin/UpgradeModal'
import { PLAN_FEATURES, PRO_PLAN, FREE_PLAN, PRO_TIERS, formatPrice } from '@/config/pricing'
import type { BillingInterval }              from '@/config/pricing'
import toast                                 from 'react-hot-toast'
import styles                                from '@/styles/components/AdminSettings.module.scss'

export default function BillingSection() {
  const { orgId, plan } = useAdminOrg()
  const { teamCount, teamLimit } = useTeamLimit()

  const [showUpgrade,    setShowUpgrade]    = useState(false)
  const [portalLoading,  setPortalLoading]  = useState(false)
  const [cancelLoading,  setCancelLoading]  = useState(false)
  const [switchLoading,  setSwitchLoading]  = useState(false)
  const [confirmCancel,  setConfirmCancel]  = useState(false)

  if (!plan || !orgId) return null

  const { effectivePlan, isTrialing, trialDaysLeft, subscription, pendingCancel } = plan
  const isPro      = effectivePlan === 'pro'
  const isExpired  = effectivePlan === 'expired'
  const curInterval: BillingInterval | null = (subscription?.billing_interval as BillingInterval) ?? null

  /* ── Actions ─────────────────────────────────────────────── */

  async function handleManageBilling() {
    setPortalLoading(true)
    try {
      const res  = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Could not open billing portal')
      }
    } catch {
      toast.error('Could not connect to billing service')
    } finally {
      setPortalLoading(false)
    }
  }

  async function handleSwitchInterval(newInterval: BillingInterval) {
    if (newInterval === curInterval) return
    setSwitchLoading(true)
    try {
      const res  = await fetch('/api/billing/switch', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ interval: newInterval }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Billing interval updated — changes take effect at next renewal')
        setTimeout(() => window.location.reload(), 1200)
      } else {
        toast.error(data.error || 'Could not switch billing interval')
      }
    } catch {
      toast.error('Could not connect to billing service')
    } finally {
      setSwitchLoading(false)
    }
  }

  async function handleCancel() {
    setCancelLoading(true)
    try {
      const res  = await fetch('/api/billing/cancel', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success('Subscription cancelled — you keep Pro until the end of your billing period')
        setConfirmCancel(false)
        setTimeout(() => window.location.reload(), 1200)
      } else {
        toast.error(data.error || 'Could not cancel subscription')
      }
    } catch {
      toast.error('Could not connect to billing service')
    } finally {
      setCancelLoading(false)
    }
  }

  async function handleReactivate() {
    setCancelLoading(true)
    try {
      const res  = await fetch('/api/billing/cancel', { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Subscription reactivated — your plan will renew as normal')
        setTimeout(() => window.location.reload(), 1200)
      } else {
        toast.error(data.error || 'Could not reactivate subscription')
      }
    } catch {
      toast.error('Could not connect to billing service')
    } finally {
      setCancelLoading(false)
    }
  }

  /* ── Interval display helpers ────────────────────────────── */

  const intervalLabel = (i: BillingInterval) =>
    i === 'week' ? 'wk' : i === 'month' ? 'mo' : 'yr'

  const otherIntervals = PRO_TIERS.filter(t => t.interval !== curInterval)

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Plan &amp; Billing</div>

      {/* ── Pending cancellation warning ─────────────────── */}
      {pendingCancel && subscription?.current_period_end && (
        <div style={{
          padding: '0.85rem 1rem', borderRadius: 10, marginBottom: '1rem',
          background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)',
          fontSize: '0.83rem', color: '#92400e',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
        }}>
          <span>
            Your subscription is cancelled and will end on{' '}
            <strong>{new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.
            You keep full Pro access until then.
          </span>
          <button
            onClick={handleReactivate}
            disabled={cancelLoading}
            style={{
              padding: '4px 12px', borderRadius: 6, border: '1px solid #d97706',
              background: 'transparent', color: '#b45309', fontWeight: 700,
              fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {cancelLoading ? 'Working…' : 'Reactivate'}
          </button>
        </div>
      )}

      {/* ── Current plan card ────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '1.25rem', background: '#f9fafb', borderRadius: 12,
        border: '1px solid #e5e7eb', marginBottom: '1.25rem',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              {isPro ? `${PRO_PLAN.name} Plan` : FREE_PLAN.name}
            </span>
            <PlanBadge />
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            {isPro && curInterval && (
              <>
                Billed {curInterval}ly &middot;{' '}
                {formatPrice(PRO_TIERS.find(t => t.interval === curInterval)?.price ?? 0)}/
                {intervalLabel(curInterval)}
              </>
            )}
            {isTrialing && `Free trial — ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} remaining`}
            {isExpired && 'Your trial has ended — upgrade to keep managing your league'}
            {!isPro && !isTrialing && !isExpired && FREE_PLAN.tagline}
          </p>
        </div>

        {!isPro ? (
          <button
            onClick={() => setShowUpgrade(true)}
            style={{
              padding: '0.55rem 1.3rem',
              background: isExpired ? '#ef4444' : '#2563eb',
              color: '#fff', borderRadius: 8, fontWeight: 700,
              fontSize: '0.85rem', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {PRO_PLAN.cta}
          </button>
        ) : (
          <button
            onClick={handleManageBilling}
            disabled={portalLoading}
            style={{
              padding: '0.55rem 1.3rem', background: '#f1f5f9', color: '#334155',
              borderRadius: 8, fontWeight: 600, fontSize: '0.85rem',
              border: '1px solid #cbd5e1', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {portalLoading ? 'Opening…' : 'Manage Billing'}
          </button>
        )}
      </div>

      {/* ── Interval switcher (Pro only, not pending cancel) ─ */}
      {isPro && !pendingCancel && curInterval && otherIntervals.length > 0 && (
        <div style={{
          padding: '1rem', background: '#f8fafc', borderRadius: 10,
          border: '1px solid #e2e8f0', marginBottom: '1.25rem',
        }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', margin: '0 0 0.6rem' }}>
            Switch billing interval
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {otherIntervals.map(tier => (
              <button
                key={tier.interval}
                onClick={() => handleSwitchInterval(tier.interval)}
                disabled={switchLoading}
                style={{
                  padding: '0.4rem 0.9rem', borderRadius: 7, fontSize: '0.8rem', fontWeight: 600,
                  border: '1px solid #2563eb', background: 'transparent', color: '#2563eb',
                  cursor: switchLoading ? 'not-allowed' : 'pointer', opacity: switchLoading ? 0.6 : 1,
                }}
              >
                {switchLoading ? 'Switching…' : `Switch to ${tier.label} — ${formatPrice(tier.price)}/${intervalLabel(tier.interval)}`}
                {tier.savings ? ` (${tier.savings})` : ''}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.5rem 0 0' }}>
            Prorated immediately — you only pay the difference.
          </p>
        </div>
      )}

      {/* ── Usage summary ────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.75rem', marginBottom: '1.25rem',
      }}>
        <UsageCard
          label="Teams"
          value={`${teamCount}${teamLimit === Infinity ? '' : ` / ${teamLimit}`}`}
          warning={!isPro && teamCount >= teamLimit}
        />
        <UsageCard label="News & Articles"  value={isPro ? 'Unlimited' : 'Locked'} locked={!isPro} />
        <UsageCard label="Media Library"     value={isPro ? 'Unlimited' : 'Locked'} locked={!isPro} />
        <UsageCard label="Match Operators"   value={isPro ? 'Unlimited' : 'Locked'} locked={!isPro} />
      </div>

      {/* ── Plan comparison ──────────────────────────────── */}
      <div style={{ marginTop: '0.5rem' }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
          Compare Plans
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 360, borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: '#64748b', fontWeight: 600 }}>Feature</th>
                <th style={{ textAlign: 'center', padding: '0.5rem', color: '#64748b', fontWeight: 600, width: 80 }}>Free</th>
                <th style={{ textAlign: 'center', padding: '0.5rem', color: '#2563eb', fontWeight: 700, width: 80 }}>Pro</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURES.map((f) => (
                <tr key={f.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.5rem', color: '#334155' }}>{f.name}</td>
                  <td style={{ textAlign: 'center', padding: '0.5rem', color: '#94a3b8' }}>{f.free}</td>
                  <td style={{ textAlign: 'center', padding: '0.5rem', color: '#0f172a', fontWeight: 600 }}>{f.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Cancel section (Pro only, not already pending) ── */}
      {isPro && !pendingCancel && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
          {!confirmCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              style={{
                background: 'none', border: 'none', color: '#94a3b8',
                fontSize: '0.78rem', cursor: 'pointer', padding: 0,
                textDecoration: 'underline',
              }}
            >
              Cancel subscription
            </button>
          ) : (
            <div style={{
              padding: '1rem', borderRadius: 10, background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <p style={{ fontSize: '0.85rem', color: '#374151', margin: '0 0 0.75rem', fontWeight: 600 }}>
                Cancel your Pro subscription?
              </p>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 1rem' }}>
                You keep full Pro access until the end of your current billing period.
                After that your account moves to the free plan.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  style={{
                    padding: '0.45rem 1rem', borderRadius: 7, background: '#ef4444',
                    color: '#fff', border: 'none', fontWeight: 700,
                    fontSize: '0.82rem', cursor: cancelLoading ? 'not-allowed' : 'pointer',
                    opacity: cancelLoading ? 0.6 : 1,
                  }}
                >
                  {cancelLoading ? 'Cancelling…' : 'Yes, cancel at period end'}
                </button>
                <button
                  onClick={() => setConfirmCancel(false)}
                  style={{
                    padding: '0.45rem 1rem', borderRadius: 7, background: '#f1f5f9',
                    color: '#374151', border: '1px solid #e2e8f0',
                    fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                  }}
                >
                  Keep subscription
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  )
}

/* ── UsageCard ───────────────────────────────────────────────── */

function UsageCard({ label, value, warning, locked }: {
  label: string; value: string; warning?: boolean; locked?: boolean
}) {
  return (
    <div style={{
      padding: '0.85rem 1rem', borderRadius: 10,
      background: warning ? 'rgba(239,68,68,0.06)' : locked ? 'rgba(148,163,184,0.06)' : '#f8fafc',
      border: `1px solid ${warning ? 'rgba(239,68,68,0.2)' : '#e2e8f0'}`,
    }}>
      <div style={{
        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: '#94a3b8', marginBottom: '0.25rem',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '0.95rem', fontWeight: 700,
        color: warning ? '#ef4444' : locked ? '#94a3b8' : '#0f172a',
      }}>
        {value}
      </div>
    </div>
  )
}
