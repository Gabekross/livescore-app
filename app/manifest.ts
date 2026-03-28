// app/manifest.ts
// PWA Web App Manifest — enables "Add to Home Screen" on mobile devices.
// Uses site_settings from the org for dynamic naming where possible,
// but falls back to static defaults since manifest generation is at build time.

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'Football Live',
    short_name:       'Football',
    description:      'Live football scores, fixtures, standings and more.',
    start_url:        '/',
    display:          'standalone',
    background_color: '#070710',
    theme_color:      '#2563eb',
    icons: [
      {
        src:   '/icon-192.png',
        sizes: '192x192',
        type:  'image/png',
      },
      {
        src:   '/icon-512.png',
        sizes: '512x512',
        type:  'image/png',
      },
    ],
  }
}
