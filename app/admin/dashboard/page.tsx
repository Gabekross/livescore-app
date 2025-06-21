'use client'

import { logoutAdmin } from '@/lib/auth-actions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import styles from '@/styles/components/AdminDashboard.module.scss'

export default function AdminDashboardPage() {

  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch('/api/check-auth') // 👈 we'll add this
      const { loggedIn } = await res.json()
      if (!loggedIn) {
        router.push('/admin')
      }
    }
    checkAuth()
  }, [])

  const handleLogout = async () => {
    await logoutAdmin()
    router.push('/admin')
  }
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Admin Control Panel</h2>
      <p>Welcome to the admin panel.</p>
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
        <Link href="#" className={styles.card}>
          📅 Matches Calendar (coming soon)
        </Link>
         <Link href="/admin/players/new" className={styles.card}>
          📈 Add players to teams
          <span className={styles.hint}>Top scorers & assists</span>
        </Link>
        <Link href="/admin/players/stats" className={styles.card}>
          📈 Player Stats
          <span className={styles.hint}>Top scorers & assists</span>
        </Link>

      </div>
      <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome to the admin panel.</p>

      <button
        onClick={handleLogout}
        style={{
          marginTop: '2rem',
          padding: '0.7rem 1.2rem',
          backgroundColor: '#ff3c3c',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
    </div>
  )
}
