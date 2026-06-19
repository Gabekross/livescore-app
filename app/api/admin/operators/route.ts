// app/api/admin/operators/route.ts
// Server-side API for organization admins to manage match_operator users and
// their per-match assignments.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

function normalizeOperatorLoginId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function generatedOperatorEmail(loginId: string): string {
  return `operator-${loginId}@operators.kolusports.com`
}

async function authorizeOrgAdmin(
  request: NextRequest
): Promise<{ orgId: string; userId: string } | NextResponse> {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const adminClient = createAdminSupabaseClient()
  const { data: profile, error: profileError } = await adminClient
    .from('admin_profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['org_admin', 'billing_exempt_admin', 'power_admin'].includes(profile.role)) {
    return NextResponse.json(
      { error: `Only org admins can manage operators [debug: user=${user.id}, profile=${JSON.stringify(profile)}, err=${profileError?.message || 'none'}]` },
      { status: 403 }
    )
  }

  const requestedOrgId = new URL(request.url).searchParams.get('organization_id')
  const orgId = profile.role === 'power_admin' ? requestedOrgId : profile.organization_id

  if (!orgId) {
    return NextResponse.json(
      { error: profile.role === 'power_admin' ? 'organization_id query parameter required' : 'Your admin profile has no organization assigned' },
      { status: 400 }
    )
  }

  return { orgId, userId: user.id }
}

export async function GET(request: NextRequest) {
  const auth = await authorizeOrgAdmin(request)
  if (auth instanceof NextResponse) return auth
  const { orgId } = auth

  const adminClient = createAdminSupabaseClient()

  const { data: profiles, error } = await adminClient
    .from('admin_profiles')
    .select('id, full_name, role, created_at, operator_login_id, contact_email')
    .eq('role', 'match_operator')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const [{ data: assignments, error: assignmentError }, { data: matches, error: matchError }] = await Promise.all([
    adminClient
      .from('match_operator_assignments')
      .select('operator_id, match_id')
      .eq('organization_id', orgId),
    adminClient
      .from('matches')
      .select(`
        id, match_date, status,
        home_team:home_team_id(name),
        away_team:away_team_id(name),
        tournament:tournament_id(name)
      `)
      .eq('organization_id', orgId)
      .order('match_date', { ascending: false }),
  ])

  if (assignmentError) {
    return NextResponse.json({ error: assignmentError.message }, { status: 500 })
  }

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 })
  }

  const assignmentMap = new Map<string, string[]>()
  ;(profiles || []).forEach((profile) => assignmentMap.set(profile.id, []))
  ;(assignments || []).forEach((assignment) => {
    const current = assignmentMap.get(assignment.operator_id) || []
    current.push(assignment.match_id)
    assignmentMap.set(assignment.operator_id, current)
  })

  const operators = await Promise.all(
    (profiles || []).map(async (profile) => {
      const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id)
      return {
        ...profile,
        email: authUser?.user?.email ?? null,
        assigned_match_ids: assignmentMap.get(profile.id) || [],
      }
    })
  )

  return NextResponse.json({ operators, matches: matches || [] })
}

export async function POST(request: NextRequest) {
  const auth = await authorizeOrgAdmin(request)
  if (auth instanceof NextResponse) return auth
  const { orgId, userId } = auth

  let body: { email?: string; full_name?: string; password?: string; match_ids?: string[]; login_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, full_name, password, match_ids = [] } = body
  const loginId = normalizeOperatorLoginId(body.login_id || '')
  const contactEmail = email?.trim() || null

  if (!loginId || !full_name || !password) {
    return NextResponse.json(
      { error: 'login_id, full_name, and password are required' },
      { status: 400 }
    )
  }

  if (loginId.length < 3) {
    return NextResponse.json(
      { error: 'Login ID must be at least 3 characters' },
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
  const uniqueMatchIds = Array.from(new Set(match_ids))
  const authEmail = generatedOperatorEmail(loginId)

  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name, operator_login_id: loginId },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const { error: profileError } = await adminClient.from('admin_profiles').insert({
    id: newUser.user.id,
    role: 'match_operator',
    organization_id: orgId,
    full_name,
    operator_login_id: loginId,
    contact_email: contactEmail,
  })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  if (uniqueMatchIds.length > 0) {
    const { error: assignmentError } = await adminClient
      .from('match_operator_assignments')
      .insert(uniqueMatchIds.map((matchId) => ({
        operator_id: newUser.user.id,
        match_id: matchId,
        organization_id: orgId,
        assigned_by: userId,
      })))

    if (assignmentError) {
      await adminClient.from('admin_profiles').delete().eq('id', newUser.user.id)
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: assignmentError.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    success: true,
    operator: {
      id: newUser.user.id,
      email: authEmail,
      contact_email: contactEmail,
      operator_login_id: loginId,
      full_name,
      role: 'match_operator',
      assigned_match_ids: uniqueMatchIds,
    },
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await authorizeOrgAdmin(request)
  if (auth instanceof NextResponse) return auth
  const { orgId, userId } = auth

  let body: { operator_id?: string; match_ids?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const operatorId = body.operator_id
  const matchIds = Array.isArray(body.match_ids) ? Array.from(new Set(body.match_ids)) : []

  if (!operatorId) {
    return NextResponse.json({ error: 'operator_id is required' }, { status: 400 })
  }

  const adminClient = createAdminSupabaseClient()

  const { data: profile } = await adminClient
    .from('admin_profiles')
    .select('role, organization_id')
    .eq('id', operatorId)
    .single()

  if (!profile || profile.role !== 'match_operator' || profile.organization_id !== orgId) {
    return NextResponse.json({ error: 'Operator not found in your organization' }, { status: 404 })
  }

  if (matchIds.length > 0) {
    const { data: validMatches, error: matchError } = await adminClient
      .from('matches')
      .select('id')
      .eq('organization_id', orgId)
      .in('id', matchIds)

    if (matchError) {
      return NextResponse.json({ error: matchError.message }, { status: 500 })
    }

    if ((validMatches || []).length !== matchIds.length) {
      return NextResponse.json(
        { error: 'One or more selected matches do not belong to your organization' },
        { status: 400 }
      )
    }
  }

  const { error: deleteError } = await adminClient
    .from('match_operator_assignments')
    .delete()
    .eq('operator_id', operatorId)
    .eq('organization_id', orgId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  if (matchIds.length > 0) {
    const { error: insertError } = await adminClient
      .from('match_operator_assignments')
      .insert(matchIds.map((matchId) => ({
        operator_id: operatorId,
        match_id: matchId,
        organization_id: orgId,
        assigned_by: userId,
      })))

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, assigned_match_ids: matchIds })
}

export async function DELETE(request: NextRequest) {
  const auth = await authorizeOrgAdmin(request)
  if (auth instanceof NextResponse) return auth
  const { orgId } = auth

  const { searchParams } = new URL(request.url)
  const operatorId = searchParams.get('id')

  if (!operatorId) {
    return NextResponse.json({ error: 'id query parameter required' }, { status: 400 })
  }

  const adminClient = createAdminSupabaseClient()

  const { data: profile } = await adminClient
    .from('admin_profiles')
    .select('role, organization_id')
    .eq('id', operatorId)
    .single()

  if (!profile || profile.role !== 'match_operator' || profile.organization_id !== orgId) {
    return NextResponse.json(
      { error: 'Operator not found in your organization' },
      { status: 404 }
    )
  }

  const { error: deleteError } = await adminClient
    .from('admin_profiles')
    .delete()
    .eq('id', operatorId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  await adminClient.auth.admin.deleteUser(operatorId)

  return NextResponse.json({ success: true })
}
