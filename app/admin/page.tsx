'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'  // make sure you have your supabase client ready

import { setLoginCookie } from '@/lib/auth-actions' // adjust path as needed


// /app/admin/page.tsx
export default function AdminHomePage() {

  const router = useRouter()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // Fetch user from Supabase
    const { data, error: fetchError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single()

    if (fetchError || !data) {
      setError('Invalid username or password')
    } else {
      // Save login status in localStorage or cookies
      await setLoginCookie();
      router.push('/admin/dashboard')
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Admin Login</h1>
      <p>Enter your credentials to access the dashboard.</p>
      <form onSubmit={handleLogin} style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc' }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc' }}
          required
        />

        {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}

        <button
          type="submit"
          style={{
            padding: '0.7rem 1.2rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Go to Dashboard
        </button>
      </form>
    </div>
  )
  }
  