'use client'

// components/admin/UpgradeModal.tsx
// Full-screen upgrade modal triggered by specific actions (team limit, feature access, etc.).
// Uses value-driven copy from config/pricing.ts.

import { useState }           from 'react'
import { PRO_PLAN, PRO_TIERS, PRO_VALUE_FEATURES, formatPrice } from '@/config/pricing'
import type { BillingInterval } from '@/config/pricing'

interface UpgradeModalProps {
  open:     boolean
  onClose:  () => void
  /** Contextual headline (e.g. "Team limit reached") */
  headline?: string
  /** Contextual subtext */
  subtext?:  string
}

export default function UpgradeModal({ open, onClose, headline, subtext }: UpgradeModalProps) {
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>('month')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const selectedTier = PRO_TIERS.find(t => t.interval === selectedInterval) || PRO_TIERS[1]

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: selectedInterval }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Could not start checkout. Please try again.')
        setLoading(false)
      }
    } catch {
      alert('Could not connect to billing service. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: '2.5rem 2rem',
          maxWidth: 520, width: '92%', position: 'relative',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: '#f1f5f9', border: 'none', borderRadius: 8,
            width: 32, height: 32, cursor: 'pointer', fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748b',
          }}
        >
          ✕
        </button>

        {/* Headline */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚀</div>
          <h2 style={{
            fontSize: '1.3rem', fontWeight: 900, color: '#0f172a',
            marginBottom: '0.4rem', lineHeight: 1.25,
          }}>
            {headline || 'Unlock Full Control'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
            {subtext || `${PRO_PLAN.tagline}. Choose a billing cycle that works for you.`}
          </p>
        </div>

        {/* Billing selector */}
        <div style={{
          display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
          background: '#f8fafc', borderRadius: 12, padding: '0.35rem',
          border: '1px solid #e2e8f0',
        }}>
          {PRO_TIERS.map((tier) => (
            <button
              key={tier.interval}
              onClick={() => setSelectedInterval(tier.interval)}
              style={{
                flex: 1, padding: '0.6rem 0.5rem', borderRadius: 10,
                border: 'none', cursor: 'pointer', textAlign: 'center',
                fontWeight: 700, fontSize: '0.8rem', transition: 'all 150ms ease',
                background: selectedInterval === tier.interval ? '#2563eb' : 'transparent',
                color: selectedInterval === tier.interval ? '#fff' : '#64748b',
              }}
            >
              <div>{tier.label}</div>
              <div style={{
                fontSize: '0.72rem', fontWeight: 600, marginTop: '0.15rem',
                opacity: selectedInterval === tier.interval ? 0.85 : 0.7,
              }}>
                {formatPrice(tier.price)}/{tier.interval === 'week' ? 'wk' : tier.interval === 'month' ? 'mo' : 'yr'}
              </div>
              {tier.savings && (
                <div style={{
                  fontSize: '0.6rem', fontWeight: 800,
                  color: selectedInterval === tier.interval ? '#bbf7d0' : '#16a34a',
                  marginTop: '0.1rem',
                }}>
                  {tier.savings}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Features */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.55rem',
          marginBottom: '1.5rem',
        }}>
          {PRO_VALUE_FEATURES.map((f) => (
            <div key={f.title} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              fontSize: '0.85rem', color: '#334155',
            }}>
              <span style={{ flexShrink: 0 }}>{f.icon}</span>
              <div>
                <span style={{ fontWeight: 700 }}>{f.title}</span>
                <span style={{ color: '#94a3b8' }}> — {f.text}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            width: '100%', padding: '0.85rem', borderRadius: 12,
            background: '#2563eb', color: '#fff', border: 'none',
            fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1, transition: 'all 150ms ease',
            boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
          }}
        >
          {loading ? 'Opening checkout...' : `${PRO_PLAN.cta} — ${formatPrice(selectedTier.price)}/${selectedTier.interval === 'week' ? 'wk' : selectedTier.interval === 'month' ? 'mo' : 'yr'}`}
        </button>

        <p style={{
          textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8',
          marginTop: '0.75rem',
        }}>
          Cancel anytime. Your data is always safe.
        </p>
      </div>
    </div>
  )
}
