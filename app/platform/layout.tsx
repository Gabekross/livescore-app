// app/platform/layout.tsx
// Power admin layout — provides platform-wide context.
// This layout does NOT use AdminOrgProvider (power admin is org-agnostic).

'use client'

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAdmin } from '@/lib/auth-actions'

const NAV_ITEMS = [
  { href: '/platform',              label: 'Overview' },
  { href: '/platform/organizations', label: 'Organizations' },
  { href: '/platform/admins',        label: 'Admin Users' },
]

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a12' }}>
      {/* Top bar */}
      <nav style={{
        padding:        '0 1.5rem',
        height:         '52px',
        background:     '#111118',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        borderBottom:   '1px solid #1e1e2e',
        gap:            '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link
            href="/platform"
            style={{ color: '#f0f0ff', fontSize: '0.95rem', fontWeight: 800, textDecoration: 'none' }}
          >
            &#9917; Platform Admin
          </Link>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding:      '0.35rem 0.75rem',
                    fontSize:     '0.8rem',
                    fontWeight:   active ? 700 : 500,
                    color:        active ? '#fff' : '#8888aa',
                    background:   active ? 'rgba(99,102,241,0.15)' : 'transparent',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    transition:   'background 0.15s, color 0.15s',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: '#f59e0b',
            background: 'rgba(245,158,11,0.12)', padding: '3px 8px', borderRadius: '4px',
          }}>
            Power Admin
          </span>
          <button
            onClick={() => logoutAdmin()}
            style={{
              padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600,
              background: 'rgba(239,68,68,0.12)', color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
        {children}
      </main>
    </div>
  )
}
