'use client'

// components/admin/AdminShell.tsx
// Org admin layout shell — nav bar with org name, role badge, sign out.
// Only renders on /admin/* pages (not /platform, not /login).

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter }   from 'next/navigation'
import { useAdminOrg } from '@/contexts/AdminOrgContext'
import { supabase }    from '@/lib/supabase'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { orgName, role } = useAdminOrg()

  // On the legacy login page (/admin), render nothing — middleware redirects to /login
  if (pathname === '/admin') {
    return <>{children}</>
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f8' }}>
      <nav style={{
        padding:        '0 1.5rem',
        height:         '52px',
        background:     '#fff',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        borderBottom:   '1px solid #e5e7eb',
        gap:            '1rem',
      }}>
        {/* Left: brand + org name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Link
            href="/admin/dashboard"
            style={{
              color: '#1f2937', fontSize: '0.92rem', fontWeight: 800,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            <span style={{ fontSize: '1rem' }}>&#9917;</span>
            {orgName || 'Admin'}
          </Link>
        </div>

        {/* Right: role badge + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {role === 'power_admin' && (
            <Link
              href="/platform"
              style={{
                fontSize: '0.72rem', fontWeight: 600, color: '#d97706',
                background: 'rgba(245,158,11,0.08)', padding: '3px 8px',
                borderRadius: '4px', textDecoration: 'none',
              }}
            >
              Platform Admin
            </Link>
          )}

          {role === 'org_admin' && (
            <span style={{
              fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.04em', color: '#6366f1',
              background: 'rgba(99,102,241,0.08)', padding: '3px 8px', borderRadius: '4px',
            }}>
              Admin
            </span>
          )}

          <button
            onClick={handleSignOut}
            style={{
              padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600,
              background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb',
              borderRadius: '6px', cursor: 'pointer',
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
