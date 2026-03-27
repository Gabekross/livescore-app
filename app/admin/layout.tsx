// app/admin/layout.tsx
// Admin section wrapper — scoped to /admin/* routes.
// Provides its own minimal nav strip so admin pages have context.
// Does NOT use the dark public theme styles (those only apply to public pages).

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f7' }}>
      <nav style={{
        padding:         '0.75rem 1.5rem',
        background:      '#1a1a2e',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        borderBottom:    '1px solid #2a2a45',
      }}>
        <strong style={{ color: '#e8e8f4', fontSize: '0.95rem' }}>
          ⚽ Admin Panel
        </strong>
        <a
          href="/admin/dashboard"
          style={{ color: '#7272a0', fontSize: '0.8rem', textDecoration: 'none' }}
        >
          Dashboard
        </a>
      </nav>
      <main style={{ padding: '1.5rem' }}>
        {children}
      </main>
    </div>
  )
}
