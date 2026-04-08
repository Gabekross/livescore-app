// app/sitemap.ts
// Dynamic XML sitemap — automatically included by Next.js at /sitemap.xml
// Covers: static pages, published news articles, tournaments, teams
//
// Uses CANONICAL_ORIGIN from lib/seo.ts so all URLs consistently point to
// https://www.kolusports.com in production.

import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'
import { CANONICAL_ORIGIN }           from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = CANONICAL_ORIGIN

  // ── Static routes ────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                    priority: 1.0, changeFrequency: 'daily'   },
    { url: `${BASE}/matches`,       priority: 0.9, changeFrequency: 'hourly'  },
    { url: `${BASE}/table`,         priority: 0.8, changeFrequency: 'daily'   },
    { url: `${BASE}/teams`,         priority: 0.7, changeFrequency: 'weekly'  },
    { url: `${BASE}/tournaments`,   priority: 0.8, changeFrequency: 'weekly'  },
    { url: `${BASE}/news`,          priority: 0.8, changeFrequency: 'daily'   },
    { url: `${BASE}/archive`,       priority: 0.5, changeFrequency: 'monthly' },
    { url: `${BASE}/terms`,         priority: 0.3, changeFrequency: 'yearly'  },
    { url: `${BASE}/privacy`,       priority: 0.3, changeFrequency: 'yearly'  },
    { url: `${BASE}/cookies`,       priority: 0.2, changeFrequency: 'yearly'  },
    { url: `${BASE}/acceptable-use`, priority: 0.2, changeFrequency: 'yearly' },
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
      url:             `${BASE}/news/${p.slug}`,
      lastModified:    p.updated_at ?? p.published_at ?? undefined,
      priority:        0.7,
      changeFrequency: 'weekly',
    }))

    const tournamentEntries: MetadataRoute.Sitemap = (tournamentsRes.data ?? []).map((t) => ({
      url:             `${BASE}/tournaments/${t.slug}`,
      lastModified:    t.updated_at ?? undefined,
      priority:        0.7,
      changeFrequency: 'weekly',
    }))

    const teamEntries: MetadataRoute.Sitemap = (teamsRes.data ?? []).map((t) => ({
      url:             `${BASE}/teams/${t.id}`,
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
