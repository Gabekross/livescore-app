import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

const VISITOR_COOKIE = 'kolusports_visitor_id'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EVENT_TYPES = new Set(['site_visit', 'news_article_view'])

function normaliseVisitorId(raw: string | undefined) {
  if (raw && /^anon_[a-zA-Z0-9_-]{8,91}$/.test(raw)) return raw
  return `anon_${crypto.randomUUID()}`
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

export async function POST(request: Request) {
  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid analytics payload' }, { status: 400 })
  }

  const organizationId = body.organization_id
  const eventType = body.event_type
  const postId = body.post_id
  const path = typeof body.path === 'string' ? body.path.slice(0, 500) : null
  const payloadVisitorId = typeof body.visitor_id === 'string' ? body.visitor_id : undefined

  if (!isUuid(organizationId)) {
    return NextResponse.json({ error: 'Invalid organization id' }, { status: 400 })
  }

  if (typeof eventType !== 'string' || !EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ error: 'Invalid analytics event type' }, { status: 400 })
  }

  if (eventType === 'news_article_view' && !isUuid(postId)) {
    return NextResponse.json({ error: 'Invalid post id' }, { status: 400 })
  }

  if (eventType === 'site_visit' && postId) {
    return NextResponse.json({ error: 'Site visits cannot include a post id' }, { status: 400 })
  }

  const cookieHeader = request.headers.get('cookie') || ''
  const cookieVisitor = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${VISITOR_COOKIE}=`))
    ?.slice(VISITOR_COOKIE.length + 1)

  const visitorId = normaliseVisitorId(payloadVisitorId || (cookieVisitor ? decodeURIComponent(cookieVisitor) : undefined))
  const response = NextResponse.json({ ok: true })
  response.cookies.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })

  try {
    const admin = createAdminSupabaseClient()

    if (eventType === 'news_article_view') {
      const { data: post, error: postError } = await admin
        .from('posts')
        .select('id')
        .eq('id', postId as string)
        .eq('organization_id', organizationId)
        .eq('status', 'published')
        .single()

      if (postError || !post) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }
    }

    const { error } = await admin.rpc('record_analytics_event', {
      p_organization_id: organizationId,
      p_event_type: eventType,
      p_visitor_id: visitorId,
      p_post_id: eventType === 'news_article_view' ? postId : null,
      p_path: path,
    })

    if (error) throw error
  } catch (error) {
    console.error('Analytics tracking failed', error)
  }

  return response
}
