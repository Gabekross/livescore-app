'use client'

// components/admin/AdminBreadcrumb.tsx
// Auto-generates a breadcrumb trail from the current pathname.
// Reads dynamic segment labels from Supabase when needed (tournament names, etc.).

import { useMemo, useEffect, useState } from 'react'
import Link         from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/components/AdminBreadcrumb.module.scss'

interface Crumb {
  label: string
  href:  string
}

// Static label map for known path segments
const SEGMENT_LABELS: Record<string, string> = {
  admin:          'Admin',
  dashboard:      'Dashboard',
  tournaments:    'Tournaments',
  teams:          'Teams',
  matches:        'Matches',
  news:           'News',
  media:          'Media',
  settings:       'Settings',
  sponsors:       'Sponsors',
  operators:      'Operators',
  operator:       'Operator View',
  players:        'Players',
  admins:         'Admins',
  organizations:  'Organizations',
  platform:       'Platform',
  stages:         'Stages',
  groups:         'Groups',
  new:            'New',
  edit:           'Edit',
  view:           'View',
  friendly:       'Friendly',
  stats:          'Stats',
  'assign-teams': 'Assign Teams',
  'formation-editor': 'Formation Editor',
}

function humanize(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]
  // UUID — will be resolved async
  if (/^[0-9a-f-]{36}$/.test(segment)) return '...'
  return segment
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Segments that are UUIDs and need Supabase resolution
type ResolvedLabels = Record<string, string>

async function resolveSegmentLabel(
  segment:  string,
  prevPath: string,
): Promise<string | null> {
  if (!/^[0-9a-f-]{36}$/.test(segment)) return null

  // Detect context from the preceding path segment
  const parts = prevPath.split('/').filter(Boolean)
  const contextSegment = parts[parts.length - 1]

  try {
    if (contextSegment === 'tournaments') {
      const { data } = await supabase
        .from('tournaments')
        .select('name')
        .eq('id', segment)
        .single()
      return data?.name ?? null
    }
    if (contextSegment === 'stages') {
      const { data } = await supabase
        .from('tournament_stages')
        .select('stage_name')
        .eq('id', segment)
        .single()
      return data?.stage_name ?? null
    }
    if (contextSegment === 'groups') {
      const { data } = await supabase
        .from('groups')
        .select('name')
        .eq('id', segment)
        .single()
      return data?.name ?? null
    }
    if (contextSegment === 'matches') {
      const { data } = await supabase
        .from('matches')
        .select('home_team:home_team_id(name), away_team:away_team_id(name)')
        .eq('id', segment)
        .single()
      if (data) {
        const home = Array.isArray(data.home_team) ? data.home_team[0] : data.home_team
        const away = Array.isArray(data.away_team) ? data.away_team[0] : data.away_team
        if (home?.name && away?.name) return `${home.name} vs ${away.name}`
      }
      return null
    }
    if (contextSegment === 'teams') {
      const { data } = await supabase
        .from('teams')
        .select('name')
        .eq('id', segment)
        .single()
      return data?.name ?? null
    }
  } catch {
    return null
  }

  return null
}

export default function AdminBreadcrumb() {
  const pathname = usePathname() ?? ''
  const [resolved, setResolved] = useState<ResolvedLabels>({})

  // Build raw crumbs synchronously
  const rawCrumbs = useMemo<Crumb[]>(() => {
    const segments = pathname.split('/').filter(Boolean)
    // Skip /admin/dashboard → just show "Dashboard" not "Admin / Dashboard"
    const start = segments[0] === 'admin' ? 1 : 0
    const crumbs: Crumb[] = []
    let href = ''

    for (let i = 0; i < segments.length; i++) {
      href += '/' + segments[i]
      if (i < start) continue
      crumbs.push({ label: humanize(segments[i]), href })
    }
    return crumbs
  }, [pathname])

  // Resolve UUID labels async — MUST run before any conditional return
  // to satisfy React's Rules of Hooks (every render must call the same hooks)
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean)
    const toResolve = segments.filter(s => /^[0-9a-f-]{36}$/.test(s))
    if (toResolve.length === 0) return

    let cancelled = false

    Promise.all(
      toResolve.map(async (seg) => {
        const idx = segments.indexOf(seg)
        const prevPath = '/' + segments.slice(0, idx).join('/')
        const label = await resolveSegmentLabel(seg, prevPath)
        return { seg, label }
      })
    ).then(results => {
      if (cancelled) return
      const map: ResolvedLabels = {}
      results.forEach(({ seg, label }) => {
        if (label) map[seg] = label
      })
      setResolved(map)
    })

    return () => { cancelled = true }
  }, [pathname])

  // ── Conditional renders AFTER all hooks ──────────────────────────────

  // Hide on dashboard — it's the root, no trail needed
  if (
    pathname === '/admin/dashboard' ||
    pathname === '/admin' ||
    pathname === '/platform'
  ) return null

  // Nothing interesting to show if only 1 crumb
  if (rawCrumbs.length <= 1) return null

  const crumbs = rawCrumbs.map(c => {
    const seg = c.href.split('/').pop() ?? ''
    return resolved[seg] ? { ...c, label: resolved[seg] } : c
  })

  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={crumb.href} className={styles.crumbItem}>
            {i > 0 && <span className={styles.separator}>/</span>}
            {isLast ? (
              <span className={styles.crumbCurrent}>{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className={styles.crumbLink}>
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
