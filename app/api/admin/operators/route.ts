// app/api/admin/operators/route.ts
// Server-side API for org_admins to manage match_operator users.
//
// GET  → list match_operators for the caller's org
// POST → create a new match_operator (auth user + admin_profiles row)
// DELETE → remove a match_operator profile (and optionally the auth user)
//
// Security: caller must be org_admin or power_admin with a resolved org.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient }  from '@/lib/supabase-admin'
import { NextRequest, NextResponse }  from 'next/server'

/** Verify the caller is org_admin/power_admin and return their org_id */
async function authorizeOrgAdmin(): Promise<
  { orgId: string; userId: string } | NextResponse
> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['org_admin', 'power_admin'].includes(profile.role)) {
    return NextResponse.json(
      { error: 'Only org admins can manage operators' },
      { status: 403 }
    )
  }

  // For org_admin, use their org. For power_admin, org_id must be provided in the request.
  const orgId = profile.organization_id
  if (!orgId && profile.role === 'org_admin') {
    return NextResponse.json(
      { error: 'Your admin profile has no organization assigned' },
      { status: 400 }
    )
  }

  return { orgId: orgId!, userId: user.id }
}

// ── GET: List match_operators for the org ────────────────────────────────────

export async function GET() {
  const auth = await authorizeOrgAdmin()
  if (auth instanceof NextResponse) return auth
  const { orgId } = auth

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('id, full_name, role, created_at')
    .eq('role', 'match_operator')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch emails from auth.users via the admin client
  const adminClient = createAdminSupabaseClient()
  const profilesWithEmail = await Promise.all(
    (data || []).map(async (p) => {
      const { data: authUser } = await adminClient.auth.admin.getUserById(p.id)
      return {
        ...p,
        email: authUser?.user?.email ?? null,
      }
    })
  )

  return NextResponse.json({ operators: profilesWithEmail })
}

// ── POST: Create a new match_operator ────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await authorizeOrgAdmin()
  if (auth instanceof NextResponse) return auth
  const { orgId } = auth

  let body: { email?: string; full_name?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, full_name, password } = body
  if (!email || !full_name || !password) {
    return NextResponse.json(
      { error: 'email, full_name, and password are required' },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    )
  }

  const adminClient = createAdminSupabaseClient()

  // 1. Create the auth user (no email confirmation — admin-created users are pre-verified)
  const { data: newUser, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Mark email as confirmed
      user_metadata: { full_name },
    })

  if (authError) {
    // Common: "A user with this email address has already been registered"
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // 2. Insert admin_profiles row with match_operator role
  const { error: profileError } = await adminClient
    .from('admin_profiles')
    .insert({
      id: newUser.user.id,
      role: 'match_operator',
      organization_id: orgId,
      full_name,
    })

  if (profileError) {
    // Roll back: delete the auth user we just created
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    operator: {
      id: newUser.user.id,
      email,
      full_name,
      role: 'match_operator',
    },
  })
}

// ── DELETE: Remove a match_operator ──────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const auth = await authorizeOrgAdmin()
  if (auth instanceof NextResponse) return auth
  const { orgId } = auth

  const { searchParams } = new URL(request.url)
  const operatorId = searchParams.get('id')

  if (!operatorId) {
    return NextResponse.json({ error: 'id query parameter required' }, { status: 400 })
  }

  const adminClient = createAdminSupabaseClient()

  // Verify this operator actually belongs to this org and is a match_operator
  const { data: profile } = await adminClient
    .from('admin_profiles')
    .select('role, organization_id')
    .eq('id', operatorId)
    .single()

  if (
    !profile ||
    profile.role !== 'match_operator' ||
    profile.organization_id !== orgId
  ) {
    return NextResponse.json(
      { error: 'Operator not found in your organization' },
      { status: 404 }
    )
  }

  // Delete the admin_profiles row
  const { error: deleteError } = await adminClient
    .from('admin_profiles')
    .delete()
    .eq('id', operatorId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Also delete the auth user so they can't log in at all
  await adminClient.auth.admin.deleteUser(operatorId)

  return NextResponse.json({ success: true })
}
