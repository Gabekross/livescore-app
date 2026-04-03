// app/api/billing/portal/route.ts
// Creates a Stripe Billing Portal session for managing subscription.

import { NextResponse }              from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient }  from '@/lib/supabase-admin'
import { getStripe }                  from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Get org
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id || !['org_admin', 'power_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // 3. Get Stripe customer ID
    const admin = createAdminSupabaseClient()
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', profile.organization_id)
      .single()

    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found. Upgrade first.' }, { status: 400 })
    }

    // 4. Create portal session
    const stripe = getStripe()
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/admin/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Portal error:', err)
    return NextResponse.json({ error: 'Failed to open billing portal' }, { status: 500 })
  }
}
