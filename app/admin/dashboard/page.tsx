'use client'

// app/admin/dashboard/page.tsx
// The middleware already redirects unauthenticated users to /admin.
// The client-side supabase.auth.getUser() check here is defense-in-depth.

import { useEffect, useState } from 'react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import { supabase }            from '@/lib/supabase'
import { logoutAdmin }         from '@/lib/auth-actions'
import styles                  from '@/styles/components/AdminDashboard.module.scss'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    async function verifySession() {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.replace('/admin')
        return
      }

      // Fetch role for display (non-blocking — dashboard still loads without it)
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile) setRole(profile.role)
    }

    verifySession()
  }, [router])

  const handleLogout = async () => {
    await logoutAdmin()
  }

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className={styles.heading}>Admin Control Panel</h2>
        {role && (
          <span style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>
            {role.replace('_', ' ')}
          </span>
        )}
      </div>

      <div className={styles.grid}>
        <Link href="/admin/tournaments" className={styles.card}>
          🏆 Manage Tournaments
        </Link>
        <Link href="/admin/teams" className={styles.card}>
          👥 Manage Teams
        </Link>
        <Link href="#" className={styles.card}>
          📊 Manage Stages
          <span className={styles.hint}>(via tournament)</span>
        </Link>
        <Link href="#" className={styles.card}>
          🧩 Manage Groups
          <span className={styles.hint}>(via stage)</span>
        </Link>
        <Link href="/admin/matches/friendly/new" className={styles.card}>
          🤝 Create Friendly Match
          <span className={styles.hint}>No standings impact</span>
        </Link>
        <Link href="/admin/players/new" className={styles.card}>
          ➕ Add Player to Team
        </Link>
        <Link href="/admin/players/stats" className={styles.card}>
          📈 Player Stats
          <span className={styles.hint}>Top scorers &amp; assists</span>
        </Link>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.7rem 1.2rem',
            backgroundColor: '#c0392b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
