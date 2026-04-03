'use client'

// components/admin/ExpiredTrialGuard.tsx
// Wraps admin pages that should be read-only when the trial is expired.
// Shows an overlay banner encouraging upgrade, but still renders the page
// content underneath (view-only, no interaction).

import { useState }        from 'react'
import { useAdminOrg }     from '@/contexts/AdminOrgContext'
import UpgradeModal        from '@/components/admin/UpgradeModal'
import { PRO_PLAN }        from '@/config/pricing'

interface ExpiredTrialGuardProps {
  children: React.ReactNode
}

export default function ExpiredTrialGuard({ children }: ExpiredTrialGuardProps) {
  const { plan, loading } = useAdminOrg()
  const [showModal, setShowModal] = useState(false)

  if (loading) return null

  const isExpired = plan?.needsUpgrade ?? false

  if (!isExpired) return <>{children}</>

  return (
    <div style={{ position: 'relative' }}>
      {/* Expired banner */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '1rem', flexWrap: 'wrap',
        padding: '0.85rem 1.5rem',
        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        color: '#fff', textAlign: 'center',
      }}>
        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
          Your trial has ended. You can view your data, but editing requires a Pro plan.
        </p>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '0.45rem 1.1rem', background: '#fff', color: '#dc2626',
            borderRadius: 8, fontWeight: 800, fontSize: '0.82rem',
            border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {PRO_PLAN.cta}
        </button>
      </div>

      {/* Read-only content */}
      <div style={{ pointerEvents: 'none', opacity: 0.7 }}>
        {children}
      </div>

      <UpgradeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        headline="Your trial has ended"
        subtext="Upgrade to continue managing your league. All your data is safe and waiting."
      />
    </div>
  )
}
