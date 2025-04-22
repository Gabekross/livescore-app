'use client'

import Link from 'next/link'
import styles from '@/styles/components/AdminDashboard.module.scss'

export default function AdminDashboardPage() {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Admin Control Panel</h2>
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
      </div>
    </div>
  )
}
