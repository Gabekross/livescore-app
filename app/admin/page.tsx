'use client'

// app/admin/page.tsx
// Admin login page using Supabase Auth email/password.
// This page is rendered without the AdminShell chrome (nav bar).

import { useState, useEffect } from 'react'
import { useRouter }   from 'next/navigation'
import { supabase }    from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [checking, setChecking] = useState(true)

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/admin/dashboard')
      } else {
        setChecking(false)
      }
    }).catch(() => {
      setChecking(false)
    })
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/admin/dashboard')
    router.refresh()
  }

  if (checking) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh',
      }}>
        <div style={{
          width: '24px', height: '24px',
          border: '3px solid #e5e7eb', borderTopColor: '#2563eb',
          borderRadius: '50%', animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '80vh', padding: '2rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '380px',
        background: '#fff', borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '2.5rem 2rem',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px', height: '48px', margin: '0 auto 1rem',
            borderRadius: '12px', background: '#1a1a2e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '1.1rem', fontWeight: 800,
          }}>
            A
          </div>
          <h1 style={{
            fontSize: '1.25rem', fontWeight: 700, color: '#1f2937',
            margin: '0 0 0.35rem',
          }}>
            Admin Login
          </h1>
          <p style={{
            fontSize: '0.85rem', color: '#6b7280', margin: 0,
          }}>
            Sign in to manage your organization.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
        >
          <div>
            <label style={{
              display: 'block', fontSize: '0.78rem', fontWeight: 600,
              color: '#374151', marginBottom: '0.3rem',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              style={{
                width: '100%', padding: '0.6rem 0.75rem',
                borderRadius: '8px', border: '1px solid #d1d5db',
                fontSize: '0.9rem', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'block', fontSize: '0.78rem', fontWeight: 600,
              color: '#374151', marginBottom: '0.3rem',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%', padding: '0.6rem 0.75rem',
                borderRadius: '8px', border: '1px solid #d1d5db',
                fontSize: '0.9rem', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{
              color: '#dc2626', fontSize: '0.82rem', margin: 0,
              padding: '0.5rem 0.75rem', background: 'rgba(220,38,38,0.06)',
              borderRadius: '6px',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '0.65rem 1.2rem',
              backgroundColor: loading ? '#93c5fd' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
