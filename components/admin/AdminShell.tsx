'use client'

// components/admin/AdminShell.tsx
// Admin layout shell — renders nav bar with role badge and org indicator.
// Consumes AdminOrgContext to display current context.

import Link         from 'next/link'
import { useAdminOrg } from '@/contexts/AdminOrgContext'
import { logoutAdmin } from '@/lib/auth-actions'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { orgName, role } = useAdminOrg()

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f7' }}>
      <nav style={{
        padding:        '0 1.5rem',
        height:         '48px',
        background:     '#1a1a2e',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        borderBottom:   '1px solid #2a2a45',
        gap:            '1rem',
      }}>
        {/* Left: brand + dashboard link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            href="/admin/dashboard"
            style={{ color: '#e8e8f4', fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none' }}
          >
            Admin Panel
          </Link>

          {orgName && (
            <span style={{
              fontSize: '0.72rem',
              color: '#93a3b8',
              background: 'rgba(255,255,255,0.06)',
              padding: '2px 8px',
              borderRadius: '4px',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {orgName}
            </span>
          )}
        </div>

        {/* Right: role badge + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {role && (
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: role === 'power_admin' ? '#f59e0b' : '#60a5fa',
              background: role === 'power_admin' ? 'rgba(245,158,11,0.1)' : 'rgba(96,165,250,0.1)',
              padding: '2px 8px',
              borderRadius: '4px',
            }}>
              {role === 'power_admin' ? 'Platform Admin' : 'Org Admin'}
            </span>
          )}

          <button
            onClick={() => logoutAdmin()}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'rgba(239,68,68,0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main style={{ padding: '1.5rem' }}>
        {children}
      </main>
    </div>
  )
}
