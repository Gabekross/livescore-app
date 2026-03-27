'use client'

// app/admin/media/page.tsx
// Media library — upload images/videos to Supabase Storage,
// record metadata in public.media, copy public URLs.
//
// Setup note: Create a Supabase Storage bucket named "media" with public access
// before using this page.  Bucket can be created from the Supabase dashboard:
//   Storage → New Bucket → Name: "media" → Public: ON

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase }                                  from '@/lib/supabase'
import { getOrganizationId }                         from '@/lib/org'
import toast                                         from 'react-hot-toast'
import styles                                        from '@/styles/components/AdminMedia.module.scss'

const BUCKET = 'media'
const MAX_FILE_MB = 10

interface MediaItem {
  id:          string
  public_url:  string
  storage_path: string
  media_type:  'image' | 'video'
  alt_text:    string | null
  created_at:  string
}

type FilterType = 'all' | 'image' | 'video'

export default function AdminMediaPage() {
  const [items,    setItems]    = useState<MediaItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [filter,   setFilter]   = useState<FilterType>('all')
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const orgIdRef  = useRef<string>('')

  const fetchItems = useCallback(async () => {
    const orgId = orgIdRef.current || await getOrganizationId()
    orgIdRef.current = orgId
    const { data } = await supabase
      .from('media')
      .select('id, public_url, storage_path, media_type, alt_text, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    setItems((data || []) as MediaItem[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const uploadFile = async (file: File) => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_FILE_MB} MB.`)
      return
    }

    const orgId  = orgIdRef.current || await getOrganizationId()
    orgIdRef.current = orgId

    const ext       = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const timestamp = Date.now()
    const path      = `${orgId}/${timestamp}.${ext}`
    const mediaType: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image'

    setUploading(true)
    setUploadMsg(`Uploading ${file.name}…`)

    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`)
      setUploading(false)
      setUploadMsg('')
      return
    }

    // 2. Get the public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const publicUrl = urlData.publicUrl

    // 3. Record in media table
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
      toast.success(`${file.name} uploaded!`)
      await fetchItems()
    }

    setUploading(false)
    setUploadMsg('')
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    Array.from(files).forEach(uploadFile)
  }

  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Delete this file? This cannot be undone.')) return

    const { error: storageErr } = await supabase.storage
      .from(BUCKET)
      .remove([item.storage_path])

    if (storageErr) {
      toast.error(`Storage delete failed: ${storageErr.message}`)
      return
    }

    await supabase.from('media').delete().eq('id', item.id)
    toast.success('File deleted')
    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url)
    toast.success('URL copied!')
  }

  const filtered = items.filter((i) => filter === 'all' || i.media_type === filter)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Media Library</h1>
      <p className={styles.subheading}>
        Upload images and videos. Copy URLs to use in posts, tournament covers, or site settings.
      </p>

      {/* Upload zone */}
      <div
        className={`${styles.uploadSection} ${dragging ? styles.dragging : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
      >
        <span className={styles.uploadIcon}>📁</span>
        <div className={styles.uploadTitle}>Drag &amp; drop files here</div>
        <div className={styles.uploadHint}>
          PNG, JPG, GIF, WebP, MP4 — max {MAX_FILE_MB} MB per file
        </div>
        <button
          className={styles.uploadBtn}
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : '📤 Choose Files'}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*,video/mp4,video/webm"
          multiple
          className={styles.uploadInput}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploadMsg && <div className={styles.uploadProgress}>{uploadMsg}</div>}
      </div>

      {/* Filter */}
      <div className={styles.filterRow}>
        {(['all', 'image', 'video'] as FilterType[]).map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'image' ? '🖼️ Images' : '🎬 Videos'}
            {' '}({f === 'all' ? items.length : items.filter((i) => i.media_type === f).length})
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <p className={styles.emptyMsg}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p className={styles.emptyMsg}>
          {filter === 'all' ? 'No files uploaded yet.' : `No ${filter}s yet.`}
        </p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((item) => (
            <div key={item.id} className={styles.mediaItem}>
              {item.media_type === 'image' ? (
                <img
                  src={item.public_url}
                  alt={item.alt_text || 'Media'}
                  className={styles.mediaThumbnail}
                  loading="lazy"
                />
              ) : (
                <div className={styles.mediaVideoThumb}>🎬</div>
              )}
              <div className={styles.mediaInfo}>
                <div className={styles.mediaName} title={item.alt_text || item.storage_path}>
                  {item.alt_text || item.storage_path.split('/').pop()}
                </div>
                <div className={styles.mediaDate}>{formatDate(item.created_at)}</div>
                <button
                  className={styles.copyBtn}
                  onClick={() => handleCopy(item.public_url)}
                >
                  🔗 Copy URL
                </button>
              </div>
              <button
                className={styles.deleteItemBtn}
                onClick={() => handleDelete(item)}
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
