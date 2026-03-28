'use client'

// app/error.tsx
// Global error boundary for unhandled errors.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main
      style={{
        minHeight:      '60vh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '3rem 1.5rem',
        textAlign:      'center',
      }}
    >
      <div
        style={{
          fontSize:     '2.5rem',
          fontWeight:   800,
          color:        'var(--color-primary, #2563eb)',
          marginBottom: '0.5rem',
        }}
      >
        Oops
      </div>
      <h1
        style={{
          fontSize:     '1.2rem',
          fontWeight:   700,
          color:        'var(--color-text, #1f2937)',
          marginBottom: '0.5rem',
        }}
      >
        Something went wrong
      </h1>
      <p
        style={{
          fontSize:     '0.88rem',
          color:        'var(--color-text-secondary, #6b7280)',
          marginBottom: '2rem',
          maxWidth:     '420px',
        }}
      >
        An unexpected error occurred. Please try again, or return to the homepage if the problem persists.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={reset}
          style={{
            padding:      '0.6rem 1.5rem',
            background:   'var(--color-primary, #2563eb)',
            color:        '#fff',
            border:       'none',
            borderRadius: '8px',
            fontWeight:   600,
            fontSize:     '0.88rem',
            cursor:       'pointer',
          }}
        >
          Try Again
        </button>
        <a
          href="/"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            padding:        '0.6rem 1.5rem',
            background:     'transparent',
            color:          'var(--color-primary, #2563eb)',
            border:         '1px solid var(--color-border, #e5e7eb)',
            borderRadius:   '8px',
            fontWeight:     600,
            fontSize:       '0.88rem',
            textDecoration: 'none',
          }}
        >
          Back to Home
        </a>
      </div>
    </main>
  )
}
