'use client'

// components/admin/FeatureGate.tsx
// Declarative feature gate — renders children only if the org's plan allows it.
// Shows a value-driven upgrade prompt when the feature is locked.

import { useState }           from 'react'
import { useAdminOrg }        from '@/contexts/AdminOrgContext'
import UpgradeModal           from '@/components/admin/UpgradeModal'
import { PRO_PLAN }           from '@/config/pricing'
import type { PlanAccess }    from '@/lib/subscription'

type FeatureKey = keyof Pick<PlanAccess,
  'canPublishNews' | 'canManageMedia' | 'canUseOperators' | 'canCustomBrand'
>

// Map feature keys to human-readable names and value propositions
const FEATURE_INFO: Record<FeatureKey, { label: string; headline: string; subtext: string }> = {
  canPublishNews:  {
    label:    'News & Articles',
    headline: 'Keep your audience engaged',
    subtext:  'Publish articles, post updates, and build a following — all from your admin dashboard.',
  },
  canManageMedia:  {
    label:    'Media Library',
    headline: 'Showcase your league visually',
    subtext:  'Upload photos, videos, and match highlights to bring your site to life.',
  },
  canUseOperators: {
    label:    'Match Operators',
    headline: 'Let your team manage match day',
    subtext:  'Give game-day staff restricted access to update live scores from any device.',
  },
  canCustomBrand:  {
    label:    'Advanced Branding',
    headline: 'Make your site truly yours',
    subtext:  'Full control over themes, branding, and site settings for a professional look.',
  },
}

interface FeatureGateProps {
  feature:   FeatureKey
  label?:    string
  softLock?: boolean
  children:  React.ReactNode
}

export default function FeatureGate({ feature, label, softLock, children }: FeatureGateProps) {
  const { plan, loading } = useAdminOrg()
  const [showModal, setShowModal] = useState(false)

  if (loading) return null

  const allowed = plan?.[feature] ?? false
  const info = FEATURE_INFO[feature]

  if (allowed) return <>{children}</>

  if (softLock) {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ opacity: 0.35, pointerEvents: 'none', filter: 'grayscale(0.3)' }}>{children}</div>
        <LockedOverlay
          label={label ?? info.label}
          onUpgrade={() => setShowModal(true)}
        />
        <UpgradeModal
          open={showModal}
          onClose={() => setShowModal(false)}
          headline={info.headline}
          subtext={info.subtext}
        />
      </div>
    )
  }

  return (
    <>
      <LockedMessage
        label={label ?? info.label}
        headline={info.headline}
        subtext={info.subtext}
        onUpgrade={() => setShowModal(true)}
      />
      <UpgradeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        headline={info.headline}
        subtext={info.subtext}
      />
    </>
  )
}

/* ── Sub-components ──────────────────────────────────────────── */

function LockedOverlay({ label, onUpgrade }: { label: string; onUpgrade: () => void }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.55)', borderRadius: 12, zIndex: 10,
    }}>
      <div style={{ textAlign: 'center', color: '#fff', padding: '1.5rem' }}>
        <p style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {label} is a Pro feature
        </p>
        <button
          onClick={onUpgrade}
          style={{
            display: 'inline-block', padding: '0.5rem 1.2rem',
            background: '#2563eb', color: '#fff', borderRadius: 8,
            fontWeight: 600, fontSize: '0.85rem', border: 'none',
            cursor: 'pointer',
          }}
        >
          {PRO_PLAN.cta}
        </button>
      </div>
    </div>
  )
}

function LockedMessage({ label, headline, subtext, onUpgrade }: {
  label: string; headline: string; subtext: string; onUpgrade: () => void
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '1rem', padding: '3rem 1.5rem',
      textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'rgba(37,99,235,0.12)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
      }}>
        🔒
      </div>
      <div>
        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text, #e8e8f4)', marginBottom: '0.35rem' }}>
          {headline}
        </p>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted, #7272a0)', maxWidth: 400, lineHeight: 1.5 }}>
          {subtext}
        </p>
      </div>
      <button
        onClick={onUpgrade}
        style={{
          display: 'inline-block', padding: '0.65rem 1.5rem',
          background: '#2563eb', color: '#fff', borderRadius: 10,
          fontWeight: 700, fontSize: '0.9rem', border: 'none',
          cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
        }}
      >
        {PRO_PLAN.cta}
      </button>
      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #7272a0)', opacity: 0.7 }}>
        {label} requires a Pro plan
      </p>
    </div>
  )
}
