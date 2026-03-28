'use client'

// app/forgot-password/page.tsx
// Password reset request page — sends reset email via Supabase Auth.

import { useState } from 'react'
import Link         from 'next/link'
import { supabase } from '@/lib/supabase'
import styles       from '@/styles/components/Auth.module.scss'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` }
    )

    if (resetErr) {
      setError(resetErr.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>&#128274;</div>
          <h1 className={styles.brandTitle}>Reset Password</h1>
          <p className={styles.brandSub}>
            {sent
              ? 'Check your email for a password reset link.'
              : 'Enter your email and we\'ll send you a reset link.'
            }
          </p>
        </div>

        {sent ? (
          <div className={styles.success}>
            A password reset link has been sent to <strong>{email}</strong>.
            Check your inbox (and spam folder).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading && <span className={styles.spinner} />}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className={styles.footer}>
          <Link href="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  )
}
