// app/api/billing/checkout/route.ts
// Creates a Stripe Checkout session for upgrading to Pro.

import { NextResponse }              from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient }  from '@/lib/supabase-admin'
import { getStripe, getStripePriceId } from '@/lib/stripe'
import type { BillingInterval }       from '@/config/pricing'

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Get org from admin profile
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    if (!['org_admin', 'power_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Only org admins can manage billing' }, { status: 403 })
    }

    const orgId = profile.organization_id

    // 3. Get or create Stripe customer
    const admin = createAdminSupabaseClient()
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_customer_id, plan, status')
      .eq('organization_id', orgId)
      .single()

    if (sub?.plan === 'pro' && sub?.status === 'active') {
      return NextResponse.json({ error: 'Already on Pro plan' }, { status: 400 })
    }

    const stripe = getStripe()
    let customerId = sub?.stripe_customer_id

    if (!customerId) {
      // Get org name for the customer record
      const { data: org } = await admin
        .from('organizations')
        .select('name, slug')
        .eq('id', orgId)
        .single()

      const customer = await stripe.customers.create({
        email: user.email,
        name: org?.name || undefined,
        metadata: { organization_id: orgId, org_slug: org?.slug || '' },
      })

      customerId = customer.id

      // Save Stripe customer ID
      await admin
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('organization_id', orgId)
    }

    // 4. Parse billing interval preference (weekly, monthly, yearly)
    const body = await request.json().catch(() => ({}))
    const validIntervals: BillingInterval[] = ['week', 'month', 'year']
    const interval: BillingInterval = validIntervals.includes(body.interval) ? body.interval : 'month'
    const priceId = getStripePriceId(interval)

    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price not configured for ${interval} billing. Set STRIPE_PRICE_PRO_${interval.toUpperCase()}LY env var.` },
        { status: 500 }
      )
    }

    // 5. Create Checkout session
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/admin/settings?billing=success`,
      cancel_url:  `${origin}/admin/settings?billing=canceled`,
      subscription_data: {
        metadata: { organization_id: orgId },
      },
      metadata: { organization_id: orgId },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
