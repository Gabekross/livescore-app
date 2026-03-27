'use client'

// app/admin/news/[id]/edit/page.tsx
// Edit an existing post. Loads the post and passes it to PostForm.

import { useEffect, useState }   from 'react'
import { useParams }             from 'next/navigation'
import { supabase }              from '@/lib/supabase'
import PostForm, { PostFormValues } from '@/components/admin/PostForm'

interface RawPost {
  id:              string
  title:           string
  slug:            string
  excerpt:         string | null
  body:            string | null
  cover_image_url: string | null
  og_image_url:    string | null
  seo_title:       string | null
  seo_description: string | null
  status:          'draft' | 'published'
  tournament_id:   string | null
}

export default function EditPostPage() {
  const { id }        = useParams()
  const [post, setPost] = useState<RawPost | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase
      .from('posts')
      .select('id, title, slug, excerpt, body, cover_image_url, og_image_url, seo_title, seo_description, status, tournament_id')
      .eq('id', id)
      .single()
      .then(({ data, error: e }) => {
        if (e || !data) setError(true)
        else setPost(data as RawPost)
      })
  }, [id])

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#ef4444' }}>
        Post not found or you don&apos;t have permission to edit it.
      </div>
    )
  }

  if (!post) {
    return <div style={{ padding: '2rem', color: '#6b7280' }}>Loading…</div>
  }

  const initial: Partial<PostFormValues> = {
    title:           post.title,
    slug:            post.slug,
    excerpt:         post.excerpt         ?? '',
    body:            post.body            ?? '',
    cover_image_url: post.cover_image_url ?? '',
    og_image_url:    post.og_image_url    ?? '',
    seo_title:       post.seo_title       ?? '',
    seo_description: post.seo_description ?? '',
    status:          post.status,
    tournament_id:   post.tournament_id   ?? '',
  }

  return (
    <PostForm
      postId={post.id}
      initialValues={initial}
      heading="Edit Article"
    />
  )
}
