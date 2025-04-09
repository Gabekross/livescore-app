'use client'

import Link from 'next/link'
import styles from '@/styles/components/LandingPage.module.scss'

export default function LandingPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>⚽ Livescore Admin Portal</h1>
      <p className={styles.subheading}>Choose where you want to go:</p>

      <div className={styles.links}>
        <Link href="/admin" className={styles.linkCard}>
          🛠️ Admin Functions
        </Link>
        <Link href="/public/matches" className={styles.linkCard}>
          🌍 View Public Matches
        </Link>
      </div>
    </div>
  )
}
