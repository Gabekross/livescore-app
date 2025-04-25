import Link from "next/link";

// /app/admin/page.tsx
export default function AdminHomePage() {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Admin Dashboard</h1>
        <p>Welcome to the admin panel.</p>
        <Link 
        href="/admin/dashboard" 
        style={{
          display: 'inline-block',
          marginTop: '1.5rem',
          padding: '0.7rem 1.2rem',
          backgroundColor: '#0070f3',
          color: 'white',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}
        target="_blank" 
        rel="noopener noreferrer"
      >
        Go to Dashboard
      </Link>
      </div>
    )
  }
  