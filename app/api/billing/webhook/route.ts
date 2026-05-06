// app/api/billing/webhook/route.ts
// Stripe webhook handler — processes subscription lifecycle events.
// Configure in Stripe Dashboard:
//   Endpoint URL: https://www.kolusports.com/api/billing/webhook
//   Events: checkout.session.completed, invoice.paid, invoice.payment_failed,
//           customer.subscription.updated, customer.subscription.deleted

import { NextResponse }              from 'next/server'
import { headers }                   from 'next/headers'
import { getStripe }                 from '@/lib/stripe'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import type Stripe                   from 'stripe'

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
  const body        = await request.text()
  const headersList = await headers()
  const sig         = headersList.get('stripe-signature')

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

  // 3. Handle event + resolve orgId for logging
  let resolvedOrgId: string | null = null
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        resolvedOrgId = session.metadata?.organization_id || null
        await handleCheckoutCompleted(admin, session)
        break
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        resolvedOrgId = await resolveOrgFromInvoice(admin, invoice)
        await handleInvoicePaid(admin, invoice, resolvedOrgId)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        resolvedOrgId = await resolveOrgFromInvoice(admin, invoice)
        await handlePaymentFailed(admin, invoice, resolvedOrgId)
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        resolvedOrgId = sub.metadata?.organization_id || await getOrgByStripeSubId(admin, sub.id)
        await handleSubscriptionUpdated(admin, sub, resolvedOrgId)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        resolvedOrgId = sub.metadata?.organization_id || await getOrgByStripeSubId(admin, sub.id)
        await handleSubscriptionDeleted(admin, sub, resolvedOrgId)
        break
      }
      default:
        console.log(`Unhandled Stripe event: ${event.type}`)
    }

    // 4. Log every handled event (including invoice events)
    if (resolvedOrgId) {
      await admin.from('billing_events').insert({
        organization_id: resolvedOrgId,
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
      plan:                   'pro',
      status:                 'active',
      cancel_at_period_end:   false,
      stripe_subscription_id: stripeSubId,
      stripe_customer_id:     typeof session.customer === 'string'
        ? session.customer
        : (session.customer as Stripe.Customer | null)?.id,
    })
    .eq('organization_id', orgId)
}

async function handleInvoicePaid(
  admin: AdminClient,
  invoice: Stripe.Invoice,
  orgId: string | null,
) {
  if (!orgId) return

  const periodEnd   = invoice.lines?.data?.[0]?.period?.end
  const periodStart = invoice.lines?.data?.[0]?.period?.start

  // Restore Pro if payment recovers a past_due subscription
  await admin
    .from('subscriptions')
    .update({
      plan:                 'pro',
      status:               'active',
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end:   periodEnd   ? new Date(periodEnd   * 1000).toISOString() : null,
    })
    .eq('organization_id', orgId)
}

async function handlePaymentFailed(
  admin: AdminClient,
  invoice: Stripe.Invoice,
  orgId: string | null,
) {
  if (!orgId) return

  await admin
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('organization_id', orgId)
}

async function handleSubscriptionUpdated(
  admin: AdminClient,
  sub: Stripe.Subscription,
  orgId: string | null,
) {
  if (!orgId) return

  const interval = sub.items?.data?.[0]?.price?.recurring?.interval as
    'week' | 'month' | 'year' | undefined

  const statusMap: Record<string, string> = {
    active:   'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid:   'past_due',
    trialing: 'trialing',
    paused:   'canceled',
  }

  const raw         = sub as unknown as Record<string, unknown>
  const periodStart = typeof raw.current_period_start === 'number'
    ? new Date(raw.current_period_start * 1000).toISOString() : null
  const periodEnd   = typeof raw.current_period_end === 'number'
    ? new Date(raw.current_period_end * 1000).toISOString() : null
  const canceledAt  = typeof raw.canceled_at === 'number'
    ? new Date(raw.canceled_at * 1000).toISOString() : null

  const mappedStatus = statusMap[sub.status] || sub.status

  // Restore plan to 'pro' when an active/past_due subscription fires an update
  // (covers resubscription via portal after prior cancellation)
  const plan = ['active', 'past_due', 'trialing'].includes(mappedStatus) ? 'pro' : 'free'

  await admin
    .from('subscriptions')
    .update({
      plan,
      status:               mappedStatus,
      billing_interval:     interval ?? null,
      current_period_start: periodStart,
      current_period_end:   periodEnd,
      canceled_at:          canceledAt,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
    })
    .eq('organization_id', orgId)
}

async function handleSubscriptionDeleted(
  admin: AdminClient,
  sub: Stripe.Subscription,
  orgId: string | null,
) {
  if (!orgId) return

  await admin
    .from('subscriptions')
    .update({
      plan:                 'free',
      status:               'canceled',
      cancel_at_period_end: false,
      canceled_at:          new Date().toISOString(),
    })
    .eq('organization_id', orgId)
}

/* ── Helpers ─────────────────────────────────────────────────── */

type AdminClient2 = ReturnType<typeof createAdminSupabaseClient>

async function getOrgByStripeSubId(admin: AdminClient2, stripeSubId: string): Promise<string | null> {
  const { data } = await admin
    .from('subscriptions')
    .select('organization_id')
    .eq('stripe_subscription_id', stripeSubId)
    .single()
  return data?.organization_id || null
}

function getSubscriptionId(invoice: Stripe.Invoice): string | null {
  const raw = invoice as unknown as Record<string, unknown>
  const sub = raw.subscription
  if (typeof sub === 'string') return sub
  if (sub && typeof sub === 'object' && 'id' in sub) return (sub as { id: string }).id
  return null
}

async function resolveOrgFromInvoice(admin: AdminClient, invoice: Stripe.Invoice): Promise<string | null> {
  const subId = getSubscriptionId(invoice)
  if (!subId) return null
  return getOrgByStripeSubId(admin, subId)
}
