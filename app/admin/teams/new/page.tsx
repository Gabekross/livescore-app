'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import styles from '@/styles/components/TeamForm.module.scss'
import { v4 as uuidv4 } from 'uuid'

export default function CreateTeamPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Team name is required')
      return
    }

    setLoading(true)

    let uploadedLogoUrl = logoUrl

    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } =  await supabase.storage
      .from('team-logos')
      .upload(filePath, logoFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: logoFile.type || 'image/png', // prevent empty type
      })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error('Failed to upload logo')
        setLoading(false)
        return
      }

      const { data } = supabase.storage
        .from('team-logos')
        .getPublicUrl(filePath)

      uploadedLogoUrl = data.publicUrl
    }

    const { error } = await supabase.from('teams').insert({
      name,
      logo_url: uploadedLogoUrl || null
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Team created successfully!')
      setTimeout(() => router.push('/admin/teams'), 1000)
    }

    setLoading(false)
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.heading}>Create New Team</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Team Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            required
          />
        </label>

        <label className={styles.label}>
          Upload Logo (optional):
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setLogoFile(e.target.files[0])
              }
            }}
            className={styles.input}
          />
        </label>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Creating...' : 'Create Team'}
        </button>
      </form>
    </div>
  )
}
