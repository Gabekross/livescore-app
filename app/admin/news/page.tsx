'use client'

// app/admin/news/page.tsx
// Admin news/blog list with publish/unpublish/delete controls.

import { useEffect, useState, useCallback } from 'react'
import Link                                  from 'next/link'
import { supabase }                          from '@/lib/supabase'
import { useAdminOrg }                       from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }                   from '@/components/admin/AdminOrgGate'
import toast                                 from 'react-hot-toast'
import styles                                from '@/styles/components/AdminNews.module.scss'

interface Post {
  id:           string
  title:        string
  slug:         string
  excerpt:      string | null
  status:       string
  published_at: string | null
  created_at:   string
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminNewsPage() {
  const { orgId, loading: orgLoading } = useAdminOrg()
  const orgGate = useAdminOrgGate()
  const [posts,   setPosts]   = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    if (!orgId) return
    const { data } = await supabase
      .from('posts')
      .select('id, title, slug, excerpt, status, published_at, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    setPosts((data || []) as Post[])
    setLoading(false)
  }, [orgId])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleTogglePublish = async (post: Post) => {
    const isPublished  = post.status === 'published'
    const newStatus    = isPublished ? 'draft' : 'published'
    const published_at = newStatus === 'published' ? new Date().toISOString() : null

    const { error } = await supabase
      .from('posts')
      .update({ status: newStatus, published_at })
      .eq('id', post.id)

    if (error) {
      toast.error('Failed to update post status')
    } else {
      toast.success(newStatus === 'published' ? 'Post published!' : 'Post unpublished')
      setPosts((prev) =>
        prev.map((p) => p.id === post.id ? { ...p, status: newStatus, published_at } : p)
      )
    }
  }

  const handleDelete = async (post: Post) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return

    const { error } = await supabase.from('posts').delete().eq('id', post.id)

    if (error) {
      toast.error('Failed to delete post')
    } else {
      toast.success('Post deleted')
      setPosts((prev) => prev.filter((p) => p.id !== post.id))
    }
  }

  if (orgGate) return orgGate

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h1 className={styles.heading}>News &amp; Blog</h1>
        <Link href="/admin/news/new" className={styles.newBtn}>
          New Post
        </Link>
      </div>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading posts…</p>
      ) : posts.length === 0 ? (
        <p style={{ color: '#6b7280' }}>
          No posts yet.{' '}
          <Link href="/admin/news/new" style={{ color: '#2563eb', fontWeight: 600 }}>
            Create the first one →
          </Link>
        </p>
      ) : (
        <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Title</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Published</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.postTitle}>{post.title}</div>
                  {post.excerpt && (
                    <div className={styles.postExcerpt}>{post.excerpt}</div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2, fontFamily: 'monospace' }}>
                    /news/{post.slug}
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={`${styles.statusPill} ${post.status === 'published' ? styles.statusPublished : styles.statusDraft}`}>
                    {post.status}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.date}`}>
                  {formatDate(post.published_at || post.created_at)}
                </td>
                <td className={styles.td}>
                  <div className={styles.actions}>
                    <Link href={`/admin/news/${post.id}/edit`} className={styles.editBtn}>
                      Edit
                    </Link>
                    {post.status === 'published' ? (
                      <button
                        className={styles.unpublishBtn}
                        onClick={() => handleTogglePublish(post)}
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        className={styles.publishBtn}
                        onClick={() => handleTogglePublish(post)}
                      >
                        Publish
                      </button>
                    )}
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(post)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}
