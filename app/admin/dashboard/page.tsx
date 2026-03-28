'use client'

// app/admin/dashboard/page.tsx
// Organization admin dashboard — org-scoped workspace.
// Power admin platform controls have moved to /platform.

import Link                    from 'next/link'
import { useAdminOrg }         from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }     from '@/components/admin/AdminOrgGate'
import styles                  from '@/styles/components/AdminDashboard.module.scss'

function getPublicSiteUrl(slug: string | null): string | null {
  if (!slug) return null
  if (typeof window === 'undefined') return null
  const { protocol, hostname, port } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const portSuffix = port ? `:${port}` : ''
    return `${protocol}//${slug}.localhost${portSuffix}`
  }
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  if (rootDomain) return `${protocol}//${slug}.${rootDomain}`
  const parts = hostname.split('.')
  const root = parts.length > 2 ? parts.slice(1).join('.') : hostname
  return `${protocol}//${slug}.${root}${port ? `:${port}` : ''}`
}

export default function AdminDashboardPage() {
  const { role, orgName, orgSlug } = useAdminOrg()
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
        {orgSlug && (
          <div style={{ marginTop: '0.75rem' }}>
            <a
              href={getPublicSiteUrl(orgSlug) || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 0.85rem', background: '#eff6ff',
                border: '1px solid #bfdbfe', borderRadius: '6px',
                fontFamily: 'monospace', fontSize: '0.82rem', color: '#2563eb',
                textDecoration: 'none', fontWeight: 500,
              }}
            >
              {getPublicSiteUrl(orgSlug)} <span style={{ fontSize: '0.7rem' }}>&#8599;</span>
            </a>
          </div>
        )}
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
