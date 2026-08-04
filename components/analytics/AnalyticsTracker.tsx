'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getAnonymousVisitorId } from '@/components/analytics/anonymousVisitor'

type AnalyticsEventType = 'site_visit' | 'news_article_view'

interface Props {
  organizationId: string
  eventType: AnalyticsEventType
  postId?: string
}

export default function AnalyticsTracker({ organizationId, eventType, postId }: Props) {
  const pathname = usePathname()

  useEffect(() => {
    if (!organizationId) return
    if (eventType === 'news_article_view' && !postId) return

    const today = new Date().toISOString().slice(0, 10)
    const path = pathname || '/'
    const sessionKey = `analytics:${today}:${eventType}:${postId || 'site'}:${path}`

    try {
      if (window.sessionStorage.getItem(sessionKey)) return
      window.sessionStorage.setItem(sessionKey, '1')
    } catch {
      // Browser storage can be unavailable in private modes; still track once.
    }

    const payload = JSON.stringify({
      organization_id: organizationId,
      event_type: eventType,
      visitor_id: getAnonymousVisitorId(),
      post_id: postId,
      path,
    })

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      if (navigator.sendBeacon('/api/analytics/track', blob)) return
    }

    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    })
  }, [eventType, organizationId, pathname, postId])

  return null
}
