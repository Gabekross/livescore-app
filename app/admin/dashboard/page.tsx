'use client'

// app/admin/dashboard/page.tsx
// Role-aware admin dashboard.
// Uses AdminOrgContext for org + role; no separate profile fetch needed.

import Link                    from 'next/link'
import { useAdminOrg }         from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }     from '@/components/admin/AdminOrgGate'
import styles                  from '@/styles/components/AdminDashboard.module.scss'

export default function AdminDashboardPage() {
  const { orgId, role, orgName } = useAdminOrg()
  const orgGate = useAdminOrgGate()

  if (orgGate) return orgGate

  const isPowerAdmin = role === 'power_admin'

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.heading}>
          {orgName ? `${orgName} Dashboard` : 'Admin Dashboard'}
        </h2>
        <p className={styles.subheading}>
          {isPowerAdmin
            ? 'Platform-wide administration. You have access to all organizations.'
            : `Managing ${orgName || 'your organization'}. Use the sections below to manage content and matches.`}
        </p>
      </div>

      {/* ── Football Operations ──────────────────────────────── */}
      <div className={styles.sectionLabel}>Football Operations</div>
      <div className={styles.grid}>
        <Link href="/admin/tournaments" className={styles.card}>
          Tournaments
          <span className={styles.hint}>Stages, groups, matches</span>
        </Link>
        <Link href="/admin/teams" className={styles.card}>
          Teams
          <span className={styles.hint}>Rosters and logos</span>
        </Link>
        <Link href="/admin/matches/friendly/new" className={styles.card}>
          Friendly Match
          <span className={styles.hint}>No standings impact</span>
        </Link>
        <Link href="/admin/players/new" className={styles.card}>
          Add Player
          <span className={styles.hint}>Assign to a team</span>
        </Link>
        <Link href="/admin/players/stats" className={styles.card}>
          Player Stats
          <span className={styles.hint}>Goals, cards, assists</span>
        </Link>
      </div>

      {/* ── Content & Site ───────────────────────────────────── */}
      <div className={styles.sectionLabel}>Content &amp; Site</div>
      <div className={styles.grid}>
        <Link href="/admin/news" className={styles.card}>
          News &amp; Articles
          <span className={styles.hint}>Publish and manage posts</span>
        </Link>
        <Link href="/admin/media" className={styles.card}>
          Media Library
          <span className={styles.hint}>Images and videos</span>
        </Link>
        <Link href="/admin/settings" className={styles.card}>
          Site Settings
          <span className={styles.hint}>Branding, theme, SEO</span>
        </Link>
      </div>

      {/* ── Platform Admin (power_admin only) ────────────────── */}
      {isPowerAdmin && (
        <div className={styles.platformSection}>
          <div className={styles.platformLabel}>Platform Administration</div>
          <div className={styles.grid}>
            <Link href="/admin/organizations" className={styles.platformCard}>
              Organizations
              <span className={styles.hint}>Create and manage orgs</span>
            </Link>
            <Link href="/admin/admins" className={styles.platformCard}>
              Admin Users
              <span className={styles.hint}>Manage admin accounts</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
