// app/not-found.tsx
// Custom 404 page with clean design and navigation back.

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found',
}

export default function NotFound() {
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
          fontSize:   '4rem',
          fontWeight: 800,
          color:      'var(--color-primary, #2563eb)',
          lineHeight: 1,
          marginBottom: '0.5rem',
        }}
      >
        404
      </div>
      <h1
        style={{
          fontSize:     '1.3rem',
          fontWeight:   700,
          color:        'var(--color-text, #1f2937)',
          marginBottom: '0.5rem',
        }}
      >
        Page Not Found
      </h1>
      <p
        style={{
          fontSize:     '0.9rem',
          color:        'var(--color-text-secondary, #6b7280)',
          marginBottom: '2rem',
          maxWidth:     '400px',
        }}
      >
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        href="/"
        style={{
          display:      'inline-flex',
          alignItems:   'center',
          padding:      '0.6rem 1.5rem',
          background:   'var(--color-primary, #2563eb)',
          color:        '#fff',
          borderRadius: '8px',
          fontWeight:   600,
          fontSize:     '0.9rem',
          textDecoration: 'none',
        }}
      >
        Back to Home
      </Link>
    </main>
  )
}
