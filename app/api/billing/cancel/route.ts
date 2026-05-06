// app/api/billing/cancel/route.ts
// Cancels the Pro subscription at period end (not immediately).
// The org retains Pro access until current_period_end, then the webhook
// fires customer.subscription.deleted and downgrades the org.

import { NextResponse }              from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient }  from '@/lib/supabase-admin'
import { getStripe }                  from '@/lib/stripe'

export async function POST() {
  try {
    // 1. Auth
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Role check
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id || !['org_admin', 'power_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // 3. Get active subscription
    const admin = createAdminSupabaseClient()
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id, plan, status, cancel_at_period_end')
      .eq('organization_id', profile.organization_id)
      .single()

    if (!sub?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    if (sub.plan !== 'pro' || !['active', 'past_due'].includes(sub.status)) {
      return NextResponse.json({ error: 'No active Pro subscription to cancel' }, { status: 400 })
    }

    if (sub.cancel_at_period_end) {
      return NextResponse.json({ error: 'Subscription is already scheduled to cancel' }, { status: 400 })
    }

    // 4. Schedule cancellation at period end (not immediate)
    const stripe = getStripe()
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    // 5. Reflect in DB immediately (webhook will confirm)
    await admin
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('organization_id', profile.organization_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Cancel error:', err)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}

// Reactivate a pending-cancel subscription
export async function DELETE() {
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

    if (!profile?.organization_id || !['org_admin', 'power_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const admin = createAdminSupabaseClient()
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id, cancel_at_period_end')
      .eq('organization_id', profile.organization_id)
      .single()

    if (!sub?.stripe_subscription_id || !sub.cancel_at_period_end) {
      return NextResponse.json({ error: 'No pending cancellation to reactivate' }, { status: 400 })
    }

    const stripe = getStripe()
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: false,
    })

    await admin
      .from('subscriptions')
      .update({ cancel_at_period_end: false })
      .eq('organization_id', profile.organization_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Reactivate error:', err)
    return NextResponse.json({ error: 'Failed to reactivate subscription' }, { status: 500 })
  }
}
