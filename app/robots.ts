// app/robots.ts
// Generates /robots.txt via Next.js Metadata Routes API.
//
// Production behavior:
//   - Allows crawling of all public pages
//   - Blocks /admin, /platform, /api, /login, /signup auth pages
//   - Points to the correct sitemap URL
//   - Sets canonical host

import type { MetadataRoute } from 'next'
import { CANONICAL_ORIGIN }   from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  [
          '/admin',
          '/platform',
          '/api',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
    host:    CANONICAL_ORIGIN,
  }
}
