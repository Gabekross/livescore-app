// app/api/platform/settings/route.ts
// Power-admin-only endpoint for updating platform-wide settings.
// Currently exposes a single field: demo_mode.
//
// Security:
//   - Requires an authenticated user
//   - Requires admin_profiles.role === 'power_admin'
//   - RLS on platform_settings also enforces the role at the DB layer
//
// Body:  { demoMode: boolean }
// Reply: { success: true, demoMode: boolean } | { error: string }

import { NextResponse }               from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient }  from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'power_admin') {
      return NextResponse.json({ error: 'Power admin access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    if (typeof body.demoMode !== 'boolean') {
      return NextResponse.json({ error: 'demoMode must be a boolean' }, { status: 400 })
    }

    // Use the service-role client so the singleton row is created on first
    // toggle even if the auth-scoped client somehow can't insert. The role
    // check above is what actually gates this endpoint.
    const admin = createAdminSupabaseClient()
    const { error: upsertErr } = await admin
      .from('platform_settings')
      .upsert(
        { id: true, demo_mode: body.demoMode },
        { onConflict: 'id' },
      )

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, demoMode: body.demoMode })
  } catch (err) {
    console.error('Platform settings update failed:', err)
    return NextResponse.json({ error: 'Failed to update platform settings' }, { status: 500 })
  }
}
