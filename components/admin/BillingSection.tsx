'use client'

// components/admin/BillingSection.tsx
// Billing & Plan section — full plan display with usage, comparison, and upgrade.
// All pricing values sourced from config/pricing.ts.

import { useState }                          from 'react'
import { useAdminOrg }                       from '@/contexts/AdminOrgContext'
import { useTeamLimit }                      from '@/hooks/useTeamLimit'
import PlanBadge                             from '@/components/admin/PlanBadge'
import UpgradeModal                          from '@/components/admin/UpgradeModal'
import { PLAN_FEATURES, PRO_PLAN, FREE_PLAN, PRO_TIERS, formatPrice } from '@/config/pricing'
import styles                                from '@/styles/components/AdminSettings.module.scss'

export default function BillingSection() {
  const { orgId, plan } = useAdminOrg()
  const { teamCount, teamLimit } = useTeamLimit()
  const [showUpgrade, setShowUpgrade] = useState(false)

  if (!plan || !orgId) return null

  const { effectivePlan, isTrialing, trialDaysLeft, subscription } = plan
  const isPro = effectivePlan === 'pro'
  const isExpired = effectivePlan === 'expired'

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Plan &amp; Billing</div>

      {/* ── Current plan ────────────────────────────── */}
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
            {isPro && subscription?.billing_interval && (
              <>Billed {subscription.billing_interval}ly &middot; {formatPrice(
                PRO_TIERS.find(t => t.interval === subscription.billing_interval)?.price ?? 0
              )}/{subscription.billing_interval === 'week' ? 'wk' : subscription.billing_interval === 'month' ? 'mo' : 'yr'}</>
            )}
            {isTrialing && `Trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} — explore all features!`}
            {isExpired && 'Your trial has ended — upgrade to keep managing your league'}
            {!isPro && !isTrialing && !isExpired && FREE_PLAN.tagline}
          </p>
        </div>

        {!isPro ? (
          <button
            onClick={() => setShowUpgrade(true)}
            style={{
              padding: '0.55rem 1.3rem', background: isExpired ? '#ef4444' : '#2563eb', color: '#fff',
              borderRadius: 8, fontWeight: 700, fontSize: '0.85rem',
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {PRO_PLAN.cta}
          </button>
        ) : (
          <button
            onClick={handleManageBilling}
            style={{
              padding: '0.55rem 1.3rem', background: '#f1f5f9', color: '#334155',
              borderRadius: 8, fontWeight: 600, fontSize: '0.85rem',
              border: '1px solid #cbd5e1', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Manage Billing
          </button>
        )}
      </div>

      {/* ── Usage summary ───────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.75rem', marginBottom: '1.25rem',
      }}>
        <UsageCard
          label="Teams"
          value={`${teamCount}${teamLimit === Infinity ? '' : ` / ${teamLimit}`}`}
          warning={!isPro && teamCount >= teamLimit}
        />
        <UsageCard
          label="News & Articles"
          value={isPro ? 'Unlimited' : 'Locked'}
          locked={!isPro}
        />
        <UsageCard
          label="Media Library"
          value={isPro ? 'Unlimited' : 'Locked'}
          locked={!isPro}
        />
        <UsageCard
          label="Match Operators"
          value={isPro ? 'Unlimited' : 'Locked'}
          locked={!isPro}
        />
      </div>

      {/* ── Plan comparison ─────────────────────────── */}
      <div style={{ marginTop: '0.5rem' }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
          Compare Plans
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem 0.5rem', color: '#64748b', fontWeight: 600 }}>Feature</th>
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

      {/* Upgrade modal */}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────────────── */

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

async function handleManageBilling() {
  try {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      alert(data.error || 'Could not open billing portal. Please try again.')
    }
  } catch {
    alert('Could not connect to billing service. Please try again.')
  }
}
