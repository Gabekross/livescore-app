import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

function normalizeOperatorLoginId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  let body: { login?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const login = body.login?.trim() || ''

  if (!login) {
    return NextResponse.json({ error: 'Login is required' }, { status: 400 })
  }

  if (login.includes('@')) {
    return NextResponse.json({ email: login })
  }

  const loginId = normalizeOperatorLoginId(login)

  if (!loginId) {
    return NextResponse.json({ error: 'Invalid login ID' }, { status: 400 })
  }

  const adminClient = createAdminSupabaseClient()
  const { data: profile, error } = await adminClient
    .from('admin_profiles')
    .select('id')
    .eq('role', 'match_operator')
    .ilike('operator_login_id', loginId)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Invalid login or password' }, { status: 404 })
  }

  const { data: authUser, error: userError } = await adminClient.auth.admin.getUserById(profile.id)

  if (userError || !authUser.user?.email) {
    return NextResponse.json({ error: 'Invalid login or password' }, { status: 404 })
  }

  return NextResponse.json({ email: authUser.user.email })
}
