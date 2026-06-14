interface TeamLogoUploadResponse {
  publicUrl?: string
  cleaned?: boolean
  fallback?: boolean
  error?: string
}

export async function uploadTeamLogo(file: File, orgId?: string | null) {
  const formData = new FormData()
  formData.append('file', file)
  if (orgId) formData.append('orgId', orgId)

  const response = await fetch('/api/admin/team-logo/upload', {
    method: 'POST',
    body: formData,
  })

  const payload = await response.json().catch(() => ({})) as TeamLogoUploadResponse
  if (!response.ok || !payload.publicUrl) {
    throw new Error(payload.error || 'Failed to upload logo')
  }

  return payload
}
