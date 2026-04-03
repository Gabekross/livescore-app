'use client'

// app/signup/page.tsx
// Self-serve SaaS signup: creates auth user + organization + admin profile in one flow.
// Uses the provision_organization() RPC for atomic provisioning.

import { useState }  from 'react'
import { useRouter } from 'next/navigation'
import Link          from 'next/link'
import { supabase }  from '@/lib/supabase'
import styles        from '@/styles/components/Auth.module.scss'

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

export default function SignupPage() {
  const router = useRouter()

  const [fullName, setFullName]   = useState('')
  const [orgName,  setOrgName]    = useState('')
  const [slug,     setSlug]       = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [email,    setEmail]      = useState('')
  const [password, setPassword]   = useState('')
  const [loading,  setLoading]    = useState(false)
  const [error,    setError]      = useState('')

  const handleOrgNameChange = (val: string) => {
    setOrgName(val)
    if (!slugEdited) {
      setSlug(toSlug(val))
    }
  }

  const handleSlugChange = (val: string) => {
    setSlugEdited(true)
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-'))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) { setError('Full name is required.'); return }
    if (!orgName.trim())  { setError('Organization name is required.'); return }
    if (!slug.trim())     { setError('URL slug is required.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setLoading(true)

    // Step 1: Create auth user via Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          org_name:  orgName.trim(),
          org_slug:  slug.trim(),
        },
      },
    })

    if (authErr) {
      setError(authErr.message)
      setLoading(false)
      return
    }

    // Step 2: If user was created but needs email confirmation
    if (authData.user && !authData.session) {
      // Supabase has email confirmation enabled — user needs to verify first
      // For now, show a message. The provisioning will happen on first login.
      setError('')
      setLoading(false)
      router.push('/signup/verify?email=' + encodeURIComponent(email.trim()))
      return
    }

    // Step 3: User is signed in — provision the organization
    if (authData.session) {
      const { error: provErr } = await supabase.rpc('provision_organization', {
        p_org_name:  orgName.trim(),
        p_org_slug:  slug.trim(),
        p_user_id:   authData.user!.id,
        p_full_name: fullName.trim(),
      })

      if (provErr) {
        // Provisioning failed — clean up by signing out
        setError(provErr.message)
        setLoading(false)
        return
      }

      // Success — go to admin dashboard
      router.push('/admin/dashboard')
      router.refresh()
      return
    }

    setError('Something went wrong. Please try again.')
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>&#127942;</div>
          <h1 className={styles.brandTitle}>Create Your Site</h1>
          <p className={styles.brandSub}>
            Set up your sports platform in minutes. No credit card required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Full Name</label>
            <input
              type="text"
              className={styles.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
              required
              autoFocus
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Organization / Tournament Name</label>
            <input
              type="text"
              className={styles.input}
              value={orgName}
              onChange={(e) => handleOrgNameChange(e.target.value)}
              placeholder="City Sports League"
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Site URL</label>
            <div className={styles.slugRow}>
              <span className={styles.slugPrefix}>kolusports.com/</span>
              <input
                type="text"
                className={styles.slugInput}
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="city-sports-league"
                required
              />
            </div>
          </div>

          <div className={styles.divider}>Account credentials</div>

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
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading && <span className={styles.spinner} />}
            {loading ? 'Creating your site...' : 'Create My Site'}
          </button>
        </form>

        <div className={styles.footer}>
          Already have an account?{' '}
          <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
