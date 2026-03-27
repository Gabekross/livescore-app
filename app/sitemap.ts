// app/sitemap.ts
// Dynamic XML sitemap — automatically included by Next.js at /sitemap.xml
// Covers: static pages, published news articles, tournaments, teams

import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static routes ────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,               priority: 1.0, changeFrequency: 'daily'   },
    { url: `${BASE_URL}/matches`,  priority: 0.9, changeFrequency: 'hourly'  },
    { url: `${BASE_URL}/table`,    priority: 0.8, changeFrequency: 'daily'   },
    { url: `${BASE_URL}/teams`,    priority: 0.7, changeFrequency: 'weekly'  },
    { url: `${BASE_URL}/tournaments`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/news`,     priority: 0.8, changeFrequency: 'daily'   },
    { url: `${BASE_URL}/archive`,  priority: 0.5, changeFrequency: 'monthly' },
  ]

  try {
    const supabase = createServerSupabaseClient()
    const orgId    = await getOrganizationIdServer()

    // ── Fetch dynamic content in parallel ──────────────────────────────────
    const [postsRes, tournamentsRes, teamsRes] = await Promise.all([
      supabase
        .from('posts')
        .select('slug, published_at, updated_at')
        .eq('organization_id', orgId)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1000),

      supabase
        .from('tournaments')
        .select('slug, updated_at')
        .eq('organization_id', orgId)
        .order('start_date', { ascending: false })
        .limit(200),

      supabase
        .from('teams')
        .select('id, updated_at')
        .eq('organization_id', orgId)
        .limit(500),
    ])

    const postEntries: MetadataRoute.Sitemap = (postsRes.data ?? []).map((p) => ({
      url:             `${BASE_URL}/news/${p.slug}`,
      lastModified:    p.updated_at ?? p.published_at ?? undefined,
      priority:        0.7,
      changeFrequency: 'weekly',
    }))

    const tournamentEntries: MetadataRoute.Sitemap = (tournamentsRes.data ?? []).map((t) => ({
      url:             `${BASE_URL}/tournaments/${t.slug}`,
      lastModified:    t.updated_at ?? undefined,
      priority:        0.7,
      changeFrequency: 'weekly',
    }))

    const teamEntries: MetadataRoute.Sitemap = (teamsRes.data ?? []).map((t) => ({
      url:             `${BASE_URL}/teams/${t.id}`,
      lastModified:    t.updated_at ?? undefined,
      priority:        0.6,
      changeFrequency: 'monthly',
    }))

    return [
      ...staticRoutes,
      ...postEntries,
      ...tournamentEntries,
      ...teamEntries,
    ]
  } catch {
    // DB not yet connected — return only static routes
    return staticRoutes
  }
}
