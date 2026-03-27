// app/robots.ts
// Generates /robots.txt via Next.js Metadata Routes API.
// Allows all public pages; disallows the entire /admin tree.

import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  '/admin',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
