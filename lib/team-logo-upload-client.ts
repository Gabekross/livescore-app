interface TeamLogoUploadResponse {
  publicUrl?: string
  cleaned?: boolean
  fallback?: boolean
  error?: string
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])

export async function uploadTeamLogo(file: File, orgId?: string | null) {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    throw new Error('Use a PNG, JPG, JPEG, or WebP logo')
  }

  if (file.size > MAX_LOGO_BYTES) {
    throw new Error('Logo must be 2 MB or smaller')
  }

  const formData = new FormData()
  formData.append('file', file)
  if (orgId) formData.append('orgId', orgId)

  const response = await fetch('/api/admin/team-logo/upload', {
    method: 'POST',
    body: formData,
  })

  const raw = await response.text()
  let payload: TeamLogoUploadResponse = {}
  try {
    payload = raw ? JSON.parse(raw) as TeamLogoUploadResponse : {}
  } catch {
    payload = { error: raw }
  }

  if (!response.ok || !payload.publicUrl) {
    throw new Error(payload.error || `Failed to upload logo (${response.status})`)
  }

  return payload
}
