// app/manifest.ts
// PWA Web App Manifest — enables "Add to Home Screen" on mobile devices.
// Uses site_settings from the org for dynamic naming where possible,
// but falls back to static defaults since manifest generation is at build time.

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'KoluSports',
    short_name:       'KoluSports',
    description:      'Live scores, fixtures, standings, and more for leagues and tournaments.',
    start_url:        '/',
    display:          'standalone',
    orientation:      'any',
    background_color: '#070710',
    theme_color:      '#2563eb',
    categories:       ['sports', 'entertainment'],
    icons: [
      {
        src:     '/icon-192.png',
        sizes:   '192x192',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/icon-512.png',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/icon-maskable-512.png',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
