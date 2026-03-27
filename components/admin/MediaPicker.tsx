'use client'

// components/admin/MediaPicker.tsx
// Reusable modal that shows the org's media library and lets the user
// pick an image (or upload one on-the-fly). Returns the selected public URL.
//
// Usage:
//   <MediaPicker
//     open={showPicker}
//     onClose={() => setShowPicker(false)}
//     onSelect={(url) => { setFieldValue(url); setShowPicker(false) }}
//   />

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase }     from '@/lib/supabase'
import { useAdminOrg }  from '@/contexts/AdminOrgContext'
import toast             from 'react-hot-toast'
import styles            from '@/styles/components/MediaPicker.module.scss'

const BUCKET = 'media'
const MAX_FILE_MB = 10

interface MediaItem {
  id:          string
  public_url:  string
  storage_path: string
  media_type:  'image' | 'video'
  alt_text:    string | null
}

interface Props {
  open:     boolean
  onClose:  () => void
  onSelect: (url: string) => void
  /** Restrict to images only (default true) */
  imagesOnly?: boolean
}

export default function MediaPicker({ open, onClose, onSelect, imagesOnly = true }: Props) {
  const { orgId }        = useAdminOrg()
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const fetchItems = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    const query = supabase
      .from('media')
      .select('id, public_url, storage_path, media_type, alt_text')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (imagesOnly) query.eq('media_type', 'image')

    const { data } = await query
    setItems((data || []) as MediaItem[])
    setLoading(false)
  }, [orgId, imagesOnly])

  useEffect(() => {
    if (open) {
      fetchItems()
      setSelected(null)
    }
  }, [open, fetchItems])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const uploadFile = async (file: File) => {
    if (!orgId) return
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_FILE_MB} MB.`)
      return
    }

    const ext       = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const path      = `${orgId}/${Date.now()}.${ext}`
    const mediaType: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image'

    setUploading(true)

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const publicUrl = urlData.publicUrl

    const { error: dbError } = await supabase.from('media').insert({
      organization_id: orgId,
      storage_path:    path,
      public_url:      publicUrl,
      media_type:      mediaType,
      alt_text:        file.name.replace(/\.[^.]+$/, ''),
    })

    if (dbError) {
      toast.error(`DB record failed: ${dbError.message}`)
    } else {
      toast.success(`${file.name} uploaded`)
      // Auto-select the newly uploaded image
      setSelected(publicUrl)
      await fetchItems()
    }

    setUploading(false)
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    // Upload only the first file (single selection)
    uploadFile(files[0])
  }

  const handleConfirm = () => {
    if (selected) onSelect(selected)
  }

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>Select Image</div>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Upload zone */}
        <div
          className={`${styles.uploadZone} ${dragging ? styles.dragging : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        >
          <span className={styles.uploadLabel}>
            {uploading ? 'Uploading...' : 'Drag a file here or'}
          </span>
          <button
            className={styles.uploadBtnSmall}
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
          >
            Upload
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Grid */}
        <div className={styles.body}>
          {loading ? (
            <div className={styles.emptyMsg}>Loading media...</div>
          ) : items.length === 0 ? (
            <div className={styles.emptyMsg}>No images uploaded yet. Upload one above.</div>
          ) : (
            <div className={styles.grid}>
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.item} ${selected === item.public_url ? styles.itemSelected : ''}`}
                  onClick={() => setSelected(item.public_url)}
                >
                  {item.media_type === 'image' ? (
                    <img
                      src={item.public_url}
                      alt={item.alt_text || 'Media'}
                      className={styles.thumb}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.videoThumb}>Video</div>
                  )}
                  <div className={styles.itemLabel}>
                    {item.alt_text || item.storage_path.split('/').pop()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.selectBtn}
            onClick={handleConfirm}
            disabled={!selected}
          >
            Use Selected Image
          </button>
        </div>
      </div>
    </div>
  )
}
