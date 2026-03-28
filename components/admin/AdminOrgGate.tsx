'use client'

// components/admin/AdminOrgGate.tsx
// Shared loading/error gate for admin pages that require org context.
// Replaces ad-hoc inline loading/error checks across admin pages.
//
// Usage:
//   const gate = useAdminOrgGate()
//   if (gate) return gate
//   // orgId is guaranteed non-null below this line

import { useAdminOrg } from '@/contexts/AdminOrgContext'

/**
 * Returns a JSX element if the admin org context is not ready (loading/error).
 * Returns null if orgId is available — callers can safely use orgId after this.
 */
export function useAdminOrgGate(): React.ReactElement | null {
  const { orgId, loading, error, retry } = useAdminOrg()

  if (loading) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{
          width: '24px', height: '24px', margin: '0 auto 1rem',
          border: '3px solid #e5e7eb', borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading admin context...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!orgId || error) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{
          width: '48px', height: '48px', margin: '0 auto 1rem',
          borderRadius: '50%', background: 'rgba(239,68,68,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ef4444', fontSize: '1.25rem', fontWeight: 700,
        }}>!</div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
          Organization Context Error
        </h3>
        <p style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          {error?.message || 'Could not load organization context. Your admin profile may not have an assigned organization.'}
        </p>
        <button
          onClick={retry}
          style={{
            padding: '0.5rem 1.25rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            marginRight: '0.75rem',
          }}
        >
          Retry
        </button>
        <a
          href="/admin"
          style={{
            padding: '0.5rem 1.25rem',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.85rem',
            textDecoration: 'none',
          }}
        >
          Back to Login
        </a>
      </div>
    )
  }

  return null
}
