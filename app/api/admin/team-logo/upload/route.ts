import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { cleanupTeamLogo } from '@/lib/team-logo-cleanup'

export const runtime = 'nodejs'

const BUCKET = 'team-logos'
const MAX_FILE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])

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

    const originalBuffer = Buffer.from(await file.arrayBuffer())
    let uploadBuffer: Buffer<ArrayBufferLike> = originalBuffer
    let uploadContentType = originalContentType
    let cleaned = false
    let fallback = false

    try {
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
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
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
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 })
  }
}
