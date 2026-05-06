'use client'

// app/admin/error.tsx
// Admin-scoped error boundary.
// Catches unhandled errors thrown by any /admin/* page component.
// Renders with a plain white background (not the dark public-site theme)
// and shows the actual error message so it can be diagnosed.

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        minHeight:      '60vh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '3rem 1.5rem',
        textAlign:      'center',
        background:     '#fff',
        color:          '#1f2937',
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
      <h1 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
        Something went wrong on this admin page
      </h1>

      {/* Show the real error so it can be diagnosed */}
      {error?.message && (
        <pre
          style={{
            margin:        '0.75rem 0 1.5rem',
            padding:       '0.85rem 1.1rem',
            background:    '#fef2f2',
            border:        '1px solid #fecaca',
            borderRadius:  8,
            fontSize:      '0.78rem',
            color:         '#b91c1c',
            maxWidth:      580,
            overflowX:     'auto',
            textAlign:     'left',
            whiteSpace:    'pre-wrap',
            wordBreak:     'break-word',
          }}
        >
          {error.message}
          {error.digest ? `\n\nDigest: ${error.digest}` : ''}
        </pre>
      )}

      <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '1.5rem', maxWidth: 420 }}>
        Try refreshing the page. If the problem persists, share the error above with support.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={reset}
          style={{
            padding:      '0.55rem 1.25rem',
            background:   '#2563eb',
            color:        '#fff',
            border:       'none',
            borderRadius: 8,
            fontWeight:   600,
            fontSize:     '0.85rem',
            cursor:       'pointer',
          }}
        >
          Try Again
        </button>
        <a
          href="/admin/dashboard"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            padding:        '0.55rem 1.25rem',
            background:     '#f1f5f9',
            color:          '#334155',
            border:         '1px solid #e2e8f0',
            borderRadius:   8,
            fontWeight:     600,
            fontSize:       '0.85rem',
            textDecoration: 'none',
          }}
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}
