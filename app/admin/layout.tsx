// app/admin/layout.tsx
// Admin section wrapper — scoped to /admin/* routes.
// Provides org context + role awareness to all admin pages via AdminOrgProvider.

import { AdminOrgProvider } from '@/contexts/AdminOrgContext'
import AdminShell from '@/components/admin/AdminShell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminOrgProvider>
      <AdminShell>{children}</AdminShell>
    </AdminOrgProvider>
  )
}
