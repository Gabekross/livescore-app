'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import styles from '@/styles/components/TeamForm.module.scss'
import { v4 as uuidv4 } from 'uuid'

export default function EditTeamPage() {
  const { id } = useParams()
  const router = useRouter()

  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchTeam = async () => {
      if (!id || typeof id !== 'string') return

      const { data, error } = await supabase.from('teams').select('*').eq('id', id).single()
      if (error) {
        toast.error('Team not found')
        return
      }

      setName(data.name)
      setLogoUrl(data.logo_url || '')
    }

    fetchTeam()
  }, [id])

  const handleUpdate = async (e: React.FormEvent) => {
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

      const { error: uploadError } = await supabase.storage
        .from('team-logos')
        .upload(filePath, logoFile)

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

    const { error } = await supabase.from('teams')
      .update({ name, logo_url: uploadedLogoUrl || null })
      .eq('id', id)

    if (error) {
      toast.error('Update failed')
    } else {
      toast.success('Team updated!')
      setTimeout(() => router.push('/admin/teams'), 1000)
    }

    setLoading(false)
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.heading}>Edit Team</h2>
      <form onSubmit={handleUpdate} className={styles.form}>
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
          {loading ? 'Updating...' : 'Update Team'}
        </button>
      </form>
    </div>
  )
}
