import { NextResponse }               from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient }  from '@/lib/supabase-admin'

const MAX_MESSAGE_LENGTH = 1200

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id || profile.role === 'power_admin') {
      return NextResponse.json({ error: 'Organization admin access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const message = typeof body.message === 'string' ? body.message.trim() : ''

    if (message.length < 10) {
      return NextResponse.json({ error: 'Please include a little more detail.' }, { status: 400 })
    }

    const admin = createAdminSupabaseClient()
    const { data: org } = await admin
      .from('organizations')
      .select('name, public_site_enabled')
      .eq('id', profile.organization_id)
      .single()

    if (org?.public_site_enabled) {
      return NextResponse.json({ error: 'This organization is already active.' }, { status: 400 })
    }

    const { error } = await admin
      .from('support_requests')
      .insert({
        organization_id: profile.organization_id,
        requester_id:    user.id,
        requester_email: user.email ?? null,
        subject:         `Reactivate public site: ${org?.name ?? 'Organization'}`,
        message:         message.slice(0, MAX_MESSAGE_LENGTH),
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Paused organization support request failed:', err)
    return NextResponse.json({ error: 'Could not send support request' }, { status: 500 })
  }
}
