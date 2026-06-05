'use client'

import { useState }      from 'react'
import Link              from 'next/link'
import { usePathname }   from 'next/navigation'
import { useRouter }     from 'next/navigation'
import { useAdminOrg }   from '@/contexts/AdminOrgContext'
import { supabase }      from '@/lib/supabase'
import PlanBadge         from '@/components/admin/PlanBadge'
import ExpiredTrialGuard from '@/components/admin/ExpiredTrialGuard'
import HelpDrawer        from '@/components/help/HelpDrawer'
import AdminBreadcrumb   from '@/components/admin/AdminBreadcrumb'
import styles            from '@/styles/components/AdminShell.module.scss'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { orgName, role } = useAdminOrg()
  const [helpOpen, setHelpOpen] = useState(false)

  if (pathname === '/admin') {
    return <>{children}</>
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        {/* Left: brand + org name + nav links */}
        <div className={styles.navLeft}>
          <Link
            href={role === 'match_operator' ? '/admin/operator' : '/admin/dashboard'}
            className={styles.brand}
          >
            <span aria-hidden="true">&#9917;</span>
            {orgName || 'Admin'}
          </Link>
          <PlanBadge />

          {(role === 'org_admin' || role === 'billing_exempt_admin' || role === 'power_admin') && (
            <>
              <Link
                href="/admin/sponsors"
                className={`${styles.navLink} ${pathname?.startsWith('/admin/sponsors') ? styles.navLinkActive : ''}`}
              >
                Sponsors
              </Link>
              <Link
                href="/admin/settings"
                className={`${styles.navLink} ${pathname?.startsWith('/admin/settings') ? styles.navLinkActive : ''}`}
              >
                Settings
              </Link>
            </>
          )}
        </div>

        {/* Right: role badge + help + sign out */}
        <div className={styles.navRight}>
          {role === 'power_admin' && (
            <Link href="/platform" className={styles.badgePlatform}>
              Platform Admin
            </Link>
          )}

          {role === 'org_admin' && (
            <span className={styles.badgeAdmin}>Admin</span>
          )}

          {role === 'billing_exempt_admin' && (
            <span className={styles.badgeAdmin}>Billing Exempt</span>
          )}

          {role === 'match_operator' && (
            <span className={styles.badgeOperator}>Operator</span>
          )}

          <button onClick={() => setHelpOpen(true)} className={styles.helpBtn}>
            Help
          </button>

          <button onClick={handleSignOut} className={styles.signOutBtn}>
            Sign Out
          </button>
        </div>
      </nav>

      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
      <AdminBreadcrumb />

      <main className={styles.main}>
        {pathname?.startsWith('/admin/settings') ? (
          children
        ) : (
          <ExpiredTrialGuard>{children}</ExpiredTrialGuard>
        )}
      </main>
    </div>
  )
}
