import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const VISITOR_RE = /^anon_[a-zA-Z0-9_-]{8,91}$/

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

function isVisitorId(value: unknown): value is string {
  return typeof value === 'string' && VISITOR_RE.test(value)
}

async function getPublishedPost(admin: ReturnType<typeof createAdminSupabaseClient>, organizationId: string, postId: string) {
  const { data, error } = await admin
    .from('posts')
    .select('id')
    .eq('id', postId)
    .eq('organization_id', organizationId)
    .eq('status', 'published')
    .single()

  if (error || !data) return null
  return data
}

async function getLikeState(admin: ReturnType<typeof createAdminSupabaseClient>, organizationId: string, postId: string, visitorId: string) {
  const [{ count }, { data: existing }] = await Promise.all([
    admin
      .from('article_likes')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('post_id', postId),
    admin
      .from('article_likes')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('post_id', postId)
      .eq('visitor_id', visitorId)
      .maybeSingle(),
  ])

  return {
    count: count || 0,
    liked: !!existing,
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const organizationId = url.searchParams.get('organization_id')
  const postId = url.searchParams.get('post_id')
  const visitorId = url.searchParams.get('visitor_id')

  if (!isUuid(organizationId) || !isUuid(postId) || !isVisitorId(visitorId)) {
    return NextResponse.json({ error: 'Invalid like request' }, { status: 400 })
  }

  try {
    const admin = createAdminSupabaseClient()
    const post = await getPublishedPost(admin, organizationId, postId)
    if (!post) return NextResponse.json({ error: 'Article not found' }, { status: 404 })

    return NextResponse.json(await getLikeState(admin, organizationId, postId, visitorId))
  } catch (error) {
    console.error('Failed to load article like state', error)
    return NextResponse.json({ error: 'Failed to load likes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid like payload' }, { status: 400 })
  }

  const organizationId = body.organization_id
  const postId = body.post_id
  const visitorId = body.visitor_id
  const liked = body.liked

  if (!isUuid(organizationId) || !isUuid(postId) || !isVisitorId(visitorId) || typeof liked !== 'boolean') {
    return NextResponse.json({ error: 'Invalid like request' }, { status: 400 })
  }

  try {
    const admin = createAdminSupabaseClient()
    const post = await getPublishedPost(admin, organizationId, postId)
    if (!post) return NextResponse.json({ error: 'Article not found' }, { status: 404 })

    if (liked) {
      const { error } = await admin
        .from('article_likes')
        .upsert(
          { organization_id: organizationId, post_id: postId, visitor_id: visitorId },
          { onConflict: 'organization_id,post_id,visitor_id' },
        )

      if (error) throw error
    } else {
      const { error } = await admin
        .from('article_likes')
        .delete()
        .eq('organization_id', organizationId)
        .eq('post_id', postId)
        .eq('visitor_id', visitorId)

      if (error) throw error
    }

    return NextResponse.json(await getLikeState(admin, organizationId, postId, visitorId))
  } catch (error) {
    console.error('Failed to update article like', error)
    return NextResponse.json({ error: 'Failed to update like' }, { status: 500 })
  }
}
