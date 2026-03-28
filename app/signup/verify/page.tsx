'use client'

// app/signup/verify/page.tsx
// Shown when Supabase requires email verification before signing in.

import Link          from 'next/link'
import { useSearchParams } from 'next/navigation'
import styles        from '@/styles/components/Auth.module.scss'

export default function VerifyEmailPage() {
  const params = useSearchParams()
  const email  = params.get('email') || 'your email'

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>&#9993;</div>
          <h1 className={styles.brandTitle}>Check Your Email</h1>
          <p className={styles.brandSub}>
            We sent a verification link to <strong style={{ color: 'var(--color-text)' }}>{email}</strong>.
            Click the link in that email to activate your account, then sign in below.
          </p>
        </div>

        <div className={styles.footer} style={{ marginTop: '0.5rem' }}>
          <Link href="/login">Go to Sign In</Link>
        </div>
      </div>
    </div>
  )
}
