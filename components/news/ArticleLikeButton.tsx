'use client'

import { useEffect, useState } from 'react'
import { getAnonymousVisitorId } from '@/components/analytics/anonymousVisitor'
import styles from '@/styles/components/ArticlePage.module.scss'

interface Props {
  organizationId: string
  postId: string
}

interface LikeState {
  count: number
  liked: boolean
}

export default function ArticleLikeButton({ organizationId, postId }: Props) {
  const [visitorId, setVisitorId] = useState('')
  const [state, setState] = useState<LikeState>({ count: 0, liked: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const id = getAnonymousVisitorId()
    setVisitorId(id)

    const params = new URLSearchParams({
      organization_id: organizationId,
      post_id: postId,
      visitor_id: id,
    })

    fetch(`/api/articles/likes?${params.toString()}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) setState({ count: data.count || 0, liked: !!data.liked })
      })
      .finally(() => setLoading(false))
  }, [organizationId, postId])

  const toggleLike = async () => {
    if (!visitorId || saving) return
    const nextLiked = !state.liked
    const previous = state

    setSaving(true)
    setState({
      liked: nextLiked,
      count: Math.max(0, state.count + (nextLiked ? 1 : -1)),
    })

    try {
      const res = await fetch('/api/articles/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          post_id: postId,
          visitor_id: visitorId,
          liked: nextLiked,
        }),
      })

      if (!res.ok) throw new Error('Failed to update like')
      const data = await res.json()
      setState({ count: data.count || 0, liked: !!data.liked })
    } catch {
      setState(previous)
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      type="button"
      className={`${styles.likeBtn} ${state.liked ? styles.likeBtnActive : ''}`}
      onClick={toggleLike}
      disabled={loading || saving}
      aria-pressed={state.liked}
      aria-label={state.liked ? 'Unlike this article' : 'Like this article'}
    >
      <span aria-hidden="true">👍</span>
      <span>{state.count}</span>
    </button>
  )
}
