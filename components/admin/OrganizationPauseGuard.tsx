'use client'

import { useState }    from 'react'
import { useAdminOrg } from '@/contexts/AdminOrgContext'

export default function OrganizationPauseGuard() {
  const { orgName, publicSitePausedReason } = useAdminOrg()
  const [message, setMessage] = useState(
    'Hello KoluSports Support,\n\nPlease help us restore access to our organization workspace and public website.'
  )
  const [saving, setSaving] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/support/organization-paused', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Could not send request. Please try again.')
        return
      }

      setSent(true)
    } catch {
      setError('Could not connect to support. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      maxWidth: 760,
      margin: '0 auto',
      padding: 'clamp(1rem, 4vw, 2rem) 0',
    }}>
      <section style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        boxShadow: '0 18px 50px rgba(15,23,42,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: 'clamp(1.25rem, 4vw, 2rem)',
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          color: '#fff',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(251,191,36,0.14)',
            color: '#fde68a',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '0.9rem',
          }}>
            Workspace paused
          </div>
          <h1 style={{
            margin: '0 0 0.65rem',
            fontSize: 'clamp(1.55rem, 4vw, 2.3rem)',
            lineHeight: 1.12,
            letterSpacing: 0,
          }}>
            Your workspace is temporarily unavailable
          </h1>
          <p style={{
            margin: 0,
            maxWidth: 620,
            color: '#d1d5db',
            fontSize: '0.98rem',
            lineHeight: 1.65,
          }}>
            {orgName ? `${orgName} is currently in a protected access state.` : 'This organization is currently in a protected access state.'}
            {' '}Your data is safe, but editing tools are paused until our support team reviews the account.
          </p>
        </div>

        <div style={{ padding: 'clamp(1.25rem, 4vw, 2rem)' }}>
          {publicSitePausedReason && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: 10,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: '0.86rem',
              lineHeight: 1.5,
              marginBottom: '1.25rem',
            }}>
              <strong>Account note:</strong> {publicSitePausedReason}
            </div>
          )}

          <h2 style={{
            margin: '0 0 0.45rem',
            color: '#111827',
            fontSize: '1.05rem',
            fontWeight: 800,
          }}>
            Contact support
          </h2>
          <p style={{
            margin: '0 0 1rem',
            color: '#6b7280',
            fontSize: '0.9rem',
            lineHeight: 1.55,
          }}>
            Send a short request and we&apos;ll review your workspace as soon as possible.
          </p>

          {sent ? (
            <div style={{
              padding: '1rem',
              borderRadius: 10,
              background: '#ecfdf5',
              border: '1px solid #bbf7d0',
              color: '#047857',
              fontSize: '0.9rem',
              fontWeight: 700,
            }}>
              Your request has been sent. Support will review it and follow up shortly.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 1200))}
                rows={7}
                required
                minLength={10}
                style={{
                  width: '100%',
                  resize: 'vertical',
                  border: '1px solid #d1d5db',
                  borderRadius: 10,
                  padding: '0.85rem 1rem',
                  color: '#111827',
                  fontSize: '0.9rem',
                  lineHeight: 1.55,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                marginTop: '0.8rem',
              }}>
                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                  {message.length}/1200
                </span>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '0.65rem 1.2rem',
                    borderRadius: 8,
                    border: 'none',
                    background: '#2563eb',
                    color: '#fff',
                    fontWeight: 800,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.65 : 1,
                  }}
                >
                  {saving ? 'Sending...' : 'Send Support Request'}
                </button>
              </div>
              {error && (
                <p style={{ color: '#dc2626', fontSize: '0.84rem', marginTop: '0.75rem' }}>
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
