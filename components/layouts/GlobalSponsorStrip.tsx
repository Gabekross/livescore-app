'use client'

// components/layouts/GlobalSponsorStrip.tsx
// Renders the org-wide sponsor strip on all public pages.
// Sponsors are fetched once in the root layout (server-side) and passed here
// as props — same pattern as PublicNav / PublicFooter.
// Hidden on admin, platform, and auth routes.

import { usePathname }  from 'next/navigation'
import SponsorStrip     from '@/components/ui/SponsorStrip'
import type { SponsorItem } from '@/components/ui/SponsorStrip'

interface Props {
  sponsors: SponsorItem[]
}

const HIDE_ON = ['/admin', '/platform', '/login', '/signup', '/forgot-password', '/reset-password']

export default function GlobalSponsorStrip({ sponsors }: Props) {
  const pathname = usePathname()

  if (sponsors.length === 0) return null
  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null

  return <SponsorStrip sponsors={sponsors} />
}
