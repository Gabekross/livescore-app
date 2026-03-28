'use client'

// app/admin/dashboard/page.tsx
// Organization admin dashboard — org-scoped workspace.
// Power admin platform controls have moved to /platform.

import Link                    from 'next/link'
import { useAdminOrg }         from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }     from '@/components/admin/AdminOrgGate'
import styles                  from '@/styles/components/AdminDashboard.module.scss'

export default function AdminDashboardPage() {
  const { role, orgName } = useAdminOrg()
  const orgGate = useAdminOrgGate()

  if (orgGate) return orgGate

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.heading}>
          {orgName || 'Admin Dashboard'}
        </h2>
        <p className={styles.subheading}>
          Manage your football site — teams, tournaments, matches, and content.
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

      {/* Power admins who land here get a link back to platform admin */}
      {role === 'power_admin' && (
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
          <Link
            href="/platform"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px',
              color: '#d97706', fontSize: '0.82rem', fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            &#8592; Back to Platform Admin
          </Link>
        </div>
      )}
    </div>
  )
}
