// app/api/billing/switch/route.ts
// Switches an active Pro subscription to a different billing interval.
// Uses Stripe's subscription update with proration so the customer is
// charged/credited fairly for the remaining period.

import { NextResponse }              from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient }  from '@/lib/supabase-admin'
import { getStripe, getStripePriceId } from '@/lib/stripe'
import type { BillingInterval }       from '@/config/pricing'

export async function POST(request: Request) {
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

    // 3. Parse requested interval
    const body = await request.json().catch(() => ({}))
    const validIntervals: BillingInterval[] = ['week', 'month', 'year']
    const newInterval: BillingInterval = validIntervals.includes(body.interval) ? body.interval : 'month'

    const newPriceId = getStripePriceId(newInterval)
    if (!newPriceId) {
      return NextResponse.json(
        { error: `Stripe price not configured for ${newInterval} billing` },
        { status: 500 }
      )
    }

    // 4. Get current subscription
    const admin = createAdminSupabaseClient()
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id, billing_interval, plan, status')
      .eq('organization_id', profile.organization_id)
      .single()

    if (!sub?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    if (sub.plan !== 'pro' || !['active', 'past_due'].includes(sub.status)) {
      return NextResponse.json({ error: 'Only active Pro subscriptions can switch intervals' }, { status: 400 })
    }

    if (sub.billing_interval === newInterval) {
      return NextResponse.json({ error: `Already on ${newInterval}ly billing` }, { status: 400 })
    }

    // 5. Update the subscription in Stripe
    const stripe = getStripe()
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
    const itemId    = stripeSub.items.data[0]?.id

    if (!itemId) {
      return NextResponse.json({ error: 'Subscription item not found' }, { status: 500 })
    }

    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      items:              [{ id: itemId, price: newPriceId }],
      proration_behavior: 'create_prorations',
      cancel_at_period_end: false, // clear any pending cancel when switching
      metadata:           { organization_id: profile.organization_id },
    })

    // 6. Webhook will confirm, but update DB optimistically
    await admin
      .from('subscriptions')
      .update({
        billing_interval:     newInterval,
        cancel_at_period_end: false,
      })
      .eq('organization_id', profile.organization_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Switch error:', err)
    return NextResponse.json({ error: 'Failed to switch billing interval' }, { status: 500 })
  }
}
