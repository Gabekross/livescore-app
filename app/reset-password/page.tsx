'use client'

// app/reset-password/page.tsx
// Password reset completion page.
// Supabase redirects here with a session token after the user clicks the email link.
// User sets a new password, then gets redirected to login.

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import { supabase }            from '@/lib/supabase'
import styles                  from '@/styles/components/Auth.module.scss'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [checking,  setChecking]  = useState(true)

  // On mount, check that we have a valid recovery session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      setChecking(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error: updateErr } = await supabase.auth.updateUser({ password })

    if (updateErr) {
      setError(updateErr.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirect to login after 2 seconds
    setTimeout(() => router.push('/login'), 2000)
  }

  if (checking) {
    return (
      <div className={styles.page}>
        <span className={styles.spinner} />
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.brand}>
            <h1 className={styles.brandTitle}>Invalid or Expired Link</h1>
            <p className={styles.brandSub}>
              This password reset link has expired or is invalid. Please request a new one.
            </p>
          </div>
          <div className={styles.footer}>
            <Link href="/forgot-password">Request new link</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>&#128274;</div>
          <h1 className={styles.brandTitle}>Set New Password</h1>
          <p className={styles.brandSub}>
            {success
              ? 'Password updated! Redirecting to sign in...'
              : 'Choose a new password for your account.'
            }
          </p>
        </div>

        {success ? (
          <div className={styles.success}>
            Your password has been updated successfully.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>New Password</label>
              <input
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
                autoFocus
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Confirm Password</label>
              <input
                type="password"
                className={styles.input}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading && <span className={styles.spinner} />}
              {loading ? 'Updating...' : 'Update Password'}
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
