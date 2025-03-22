// app/admin/layout.tsx

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
      <div>
        <nav style={{ padding: '1rem', background: '#eee', marginBottom: '1rem' }}>
          <strong>Admin Panel</strong>
        </nav>
        <main>{children}</main>
      </div>
    )
  }
  