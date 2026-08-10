import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUCKET = 'team-logos'
const MAX_FILE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
const STORAGE_BUCKET_CONFIG = {
  public: true,
  fileSizeLimit: MAX_FILE_BYTES,
  allowedMimeTypes: Array.from(ALLOWED_TYPES),
}

async function authorizeUpload(requestedOrgId: string | null) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  }

  const admin = createAdminSupabaseClient()
  const { data: profile } = await admin
    .from('admin_profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['org_admin', 'billing_exempt_admin', 'power_admin'].includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }
  }

  const orgId = profile.role === 'power_admin'
    ? requestedOrgId || profile.organization_id
    : profile.organization_id

  if (!orgId) {
    return { error: NextResponse.json({ error: 'Organization is required' }, { status: 400 }) }
  }

  if (profile.role !== 'power_admin' && requestedOrgId && requestedOrgId !== profile.organization_id) {
    return { error: NextResponse.json({ error: 'Cannot upload for another organization' }, { status: 403 }) }
  }

  return { admin, orgId }
}

function extensionForContentType(contentType: string) {
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  return 'jpg'
}

async function ensureTeamLogoBucket(admin: ReturnType<typeof createAdminSupabaseClient>) {
  const { data: buckets, error: listError } = await admin.storage.listBuckets()
  if (listError) throw new Error(`Could not inspect storage buckets: ${listError.message}`)

  const exists = buckets?.some((bucket) => bucket.id === BUCKET || bucket.name === BUCKET)
  if (!exists) {
    const { error: createError } = await admin.storage.createBucket(BUCKET, STORAGE_BUCKET_CONFIG)
    if (createError) throw new Error(`Could not create team logo bucket: ${createError.message}`)
    return
  }

  const { error: updateError } = await admin.storage.updateBucket(BUCKET, STORAGE_BUCKET_CONFIG)
  if (updateError) {
    console.warn('Could not update team logo bucket settings:', updateError.message)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const requestedOrgId = formData.get('orgId')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Logo file is required' }, { status: 400 })
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'Logo must be 2 MB or smaller' }, { status: 400 })
    }

    const originalContentType = file.type || 'application/octet-stream'
    if (!ALLOWED_TYPES.has(originalContentType)) {
      return NextResponse.json({ error: 'Use a PNG, JPG, JPEG, or WebP logo' }, { status: 400 })
    }

    const auth = await authorizeUpload(typeof requestedOrgId === 'string' ? requestedOrgId : null)
    if (auth.error) return auth.error
    await ensureTeamLogoBucket(auth.admin)

    const originalBuffer = Buffer.from(await file.arrayBuffer())
    let uploadBuffer: Buffer<ArrayBufferLike> = originalBuffer
    let uploadContentType = originalContentType
    let cleaned = false
    let fallback = false

    try {
      const { cleanupTeamLogo } = await import('@/lib/team-logo-cleanup')
      const result = await cleanupTeamLogo(originalBuffer)
      uploadBuffer = result.buffer
      uploadContentType = result.contentType
      cleaned = result.cleaned
    } catch (err) {
      console.error('Team logo cleanup failed; uploading original:', err)
      fallback = true
    }

    const extension = uploadContentType === 'image/png'
      ? 'png'
      : extensionForContentType(originalContentType)
    const path = `${auth.orgId}/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await auth.admin.storage
      .from(BUCKET)
      .upload(path, uploadBuffer, {
        cacheControl: '31536000',
        upsert: false,
        contentType: uploadContentType,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const { data } = auth.admin.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({
      publicUrl: data.publicUrl,
      storagePath: path,
      cleaned,
      fallback,
    })
  } catch (err) {
    console.error('Team logo upload failed:', err)
    const message = err instanceof Error ? err.message : 'Failed to upload logo'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
