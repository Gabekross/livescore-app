'use client'

// app/admin/page.tsx
// Legacy login route — redirects to /login.
// Middleware already handles this redirect, but this is a fallback
// in case someone navigates client-side.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/login') }, [router])
  return null
}
