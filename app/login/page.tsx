'use client'

// app/login/page.tsx
// Shared login for all users (power_admin + org_admin).
// After auth, resolves role and redirects:
//   power_admin   → /platform
//   org_admin     → /admin/dashboard
//   no profile    → error (must sign up first or contact admin)

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import { supabase }            from '@/lib/supabase'
import styles                  from '@/styles/components/Auth.module.scss'

export default function LoginPage() {
  const router = useRouter()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [checking, setChecking] = useState(true)
  const [error,    setError]    = useState('')

  // If already authenticated, redirect based on role
  useEffect(() => {
    resolveAndRedirect().catch(() => setChecking(false))
  }, [])

  async function resolveAndRedirect() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setChecking(false); return }

    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'power_admin') {
      router.replace('/platform')
    } else if (profile?.role === 'org_admin') {
      router.replace('/admin/dashboard')
    } else {
      setChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authErr) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    // Auth succeeded — check if user needs provisioning (signed up with email verification)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Authentication failed. Please try again.')
      setLoading(false)
      return
    }

    // Check for admin profile
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profile) {
      // Existing profile — route by role
      if (profile.role === 'power_admin') {
        router.push('/platform')
      } else {
        router.push('/admin/dashboard')
      }
      router.refresh()
      return
    }

    // No profile yet — check if user signed up with org metadata (needs provisioning)
    const meta = user.user_metadata
    if (meta?.org_name && meta?.org_slug) {
      const { error: provErr } = await supabase.rpc('provision_organization', {
        p_org_name:  meta.org_name,
        p_org_slug:  meta.org_slug,
        p_user_id:   user.id,
        p_full_name: meta.full_name || null,
      })

      if (provErr) {
        setError(provErr.message)
        setLoading(false)
        return
      }

      router.push('/admin/dashboard')
      router.refresh()
      return
    }

    // No profile, no metadata — this user has no admin access
    setError('No admin account found. Please sign up first or contact your administrator.')
    await supabase.auth.signOut()
    setLoading(false)
  }

  if (checking) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={styles.spinner} />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Checking session...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>&#9917;</div>
          <h1 className={styles.brandTitle}>Welcome Back</h1>
          <p className={styles.brandSub}>
            Sign in to manage your football site.
          </p>
        </div>

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

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading && <span className={styles.spinner} />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'right', marginTop: '-0.25rem' }}>
            <Link
              href="/forgot-password"
              style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}
            >
              Forgot password?
            </Link>
          </div>
        </form>

        <div className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link href="/signup">Create your site</Link>
        </div>
      </div>
    </div>
  )
}
