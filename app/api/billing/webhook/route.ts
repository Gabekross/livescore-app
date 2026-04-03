// app/api/billing/webhook/route.ts
// Stripe webhook handler — processes subscription lifecycle events.
// Configure in Stripe Dashboard:
//   Endpoint URL: https://app.kolusports.com/api/billing/webhook
//   Events: checkout.session.completed, invoice.paid, invoice.payment_failed,
//           customer.subscription.updated, customer.subscription.deleted

import { NextResponse }             from 'next/server'
import { headers }                  from 'next/headers'
import { getStripe }                from '@/lib/stripe'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import type Stripe                  from 'stripe'

// Disable body parsing — Stripe needs the raw body for signature verification
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const stripe = getStripe()
  const admin  = createAdminSupabaseClient()
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  // 1. Verify Stripe signature
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // 2. Idempotency check
  const { data: existing } = await admin
    .from('billing_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .single()

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  // 3. Handle events
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(admin, event.data.object as Stripe.Checkout.Session)
        break

      case 'invoice.paid':
        await handleInvoicePaid(admin, event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(admin, event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(admin, event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(admin, event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`Unhandled Stripe event: ${event.type}`)
    }

    // 4. Log the event
    const orgId = extractOrgId(event)
    if (orgId) {
      await admin.from('billing_events').insert({
        organization_id: orgId,
        event_type:      event.type,
        stripe_event_id: event.id,
        payload:         event.data.object as unknown as Record<string, unknown>,
      })
    }
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

/* ── Event handlers ──────────────────────────────────────────── */

type AdminClient = ReturnType<typeof createAdminSupabaseClient>

async function handleCheckoutCompleted(admin: AdminClient, session: Stripe.Checkout.Session) {
  const orgId = session.metadata?.organization_id
  if (!orgId || session.mode !== 'subscription') return

  const stripeSubId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id

  await admin
    .from('subscriptions')
    .update({
      plan:                    'pro',
      status:                  'active',
      stripe_subscription_id:  stripeSubId,
      stripe_customer_id:      typeof session.customer === 'string' ? session.customer : session.customer?.id,
    })
    .eq('organization_id', orgId)
}

async function handleInvoicePaid(admin: AdminClient, invoice: Stripe.Invoice) {
  const subId = getSubscriptionId(invoice)
  if (!subId) return

  const orgId = await getOrgByStripeSubId(admin, subId)
  if (!orgId) return

  const periodEnd = invoice.lines?.data?.[0]?.period?.end
  const periodStart = invoice.lines?.data?.[0]?.period?.start

  await admin
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end:   periodEnd   ? new Date(periodEnd * 1000).toISOString()   : null,
    })
    .eq('organization_id', orgId)
}

async function handlePaymentFailed(admin: AdminClient, invoice: Stripe.Invoice) {
  const subId = getSubscriptionId(invoice)
  if (!subId) return

  const orgId = await getOrgByStripeSubId(admin, subId)
  if (!orgId) return

  await admin
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('organization_id', orgId)
}

async function handleSubscriptionUpdated(admin: AdminClient, sub: Stripe.Subscription) {
  const orgId = sub.metadata?.organization_id || await getOrgByStripeSubId(admin, sub.id)
  if (!orgId) return

  const interval = sub.items?.data?.[0]?.price?.recurring?.interval as 'month' | 'year' | undefined

  const statusMap: Record<string, string> = {
    active:    'active',
    past_due:  'past_due',
    canceled:  'canceled',
    unpaid:    'past_due',
    trialing:  'trialing',
    paused:    'canceled',
  }

  // Access period fields via raw object to handle Stripe API version differences
  const raw = sub as unknown as Record<string, unknown>
  const periodStart = typeof raw.current_period_start === 'number'
    ? new Date(raw.current_period_start * 1000).toISOString() : null
  const periodEnd = typeof raw.current_period_end === 'number'
    ? new Date(raw.current_period_end * 1000).toISOString() : null
  const canceledAt = typeof raw.canceled_at === 'number'
    ? new Date(raw.canceled_at * 1000).toISOString() : null

  await admin
    .from('subscriptions')
    .update({
      status:               statusMap[sub.status] || sub.status,
      billing_interval:     interval || null,
      current_period_start: periodStart,
      current_period_end:   periodEnd,
      canceled_at:          canceledAt,
    })
    .eq('organization_id', orgId)
}

async function handleSubscriptionDeleted(admin: AdminClient, sub: Stripe.Subscription) {
  const orgId = sub.metadata?.organization_id || await getOrgByStripeSubId(admin, sub.id)
  if (!orgId) return

  await admin
    .from('subscriptions')
    .update({
      plan:        'free',
      status:      'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
}

/* ── Helpers ─────────────────────────────────────────────────── */

async function getOrgByStripeSubId(admin: AdminClient, stripeSubId: string): Promise<string | null> {
  const { data } = await admin
    .from('subscriptions')
    .select('organization_id')
    .eq('stripe_subscription_id', stripeSubId)
    .single()

  return data?.organization_id || null
}

function getSubscriptionId(invoice: Stripe.Invoice): string | null {
  // Stripe v2025+ may model subscription differently
  const raw = invoice as unknown as Record<string, unknown>
  const sub = raw.subscription
  if (typeof sub === 'string') return sub
  if (sub && typeof sub === 'object' && 'id' in sub) return (sub as { id: string }).id
  return null
}

function extractOrgId(event: Stripe.Event): string | null {
  const obj = event.data.object as unknown as Record<string, unknown>

  // Check metadata on the object itself
  if (obj.metadata && typeof obj.metadata === 'object') {
    const meta = obj.metadata as Record<string, string>
    if (meta.organization_id) return meta.organization_id
  }

  return null
}
