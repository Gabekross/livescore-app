// app/api/check-auth/route.ts
// Returns { loggedIn: boolean, role: string | null } using Supabase Auth session.
// Still used by any client component that needs to know session state without
// a full page redirect. The middleware also protects routes independently.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse }               from 'next/server'

export async function GET() {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ loggedIn: false, role: null })
  }

  // Fetch role for clients that need to differentiate power_admin vs org_admin
  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    loggedIn: true,
    role: profile?.role ?? null,
  })
}
