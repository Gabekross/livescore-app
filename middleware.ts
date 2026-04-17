// middleware.ts
// Three responsibilities:
//   1. Subdomain → org-slug header injection for all requests
//   2. app.kolusports.com → admin route rewriting
//   3. Route protection (admin/platform auth checks)
//
// Hostname routing:
//   www.kolusports.com      → public site (no org-slug header)
//   kolusports.com          → redirected to www by Vercel DNS
//   app.kolusports.com      → admin area (paths rewritten to /admin/*)
//   {org}.kolusports.com    → tenant site (org-slug header injected)
//
// Route protection:
//   /admin/*          → requires authenticated user with admin_profiles row
//   /admin/operator   → accessible to match_operator, org_admin, power_admin
//   /admin/* (other)  → match_operator is redirected to /admin/operator
//   /platform/*       → requires authenticated user with role='power_admin'
//   /login, /signup, /forgot-password, /reset-password → public
//
// Uses Supabase Auth session via @supabase/ssr.
// Refreshes session cookies on every request.

import { createServerClient } from '@supabase/ssr'
import { NextResponse }        from 'next/server'
import type { NextRequest }    from 'next/server'
import { extractSubdomain, getOrgSlugFromHostname } from '@/lib/subdomain'

/** Paths on app.kolusports.com that should NOT be prefixed with /admin */
const APP_PASSTHROUGH = new Set([
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
])

// ── Role cookie cache helpers ────────────────────────────────────────────────
const ROLE_COOKIE = '__role'
const ROLE_TTL_MS = 5 * 60 * 1000 // 5 min

function getCachedRole(request: NextRequest, userId: string): string | null {
  const cookie = request.cookies.get(ROLE_COOKIE)?.value
  if (!cookie) return null
  const parts = cookie.split(':')
  if (parts.length < 3) return null
  const [cachedId, role, ts] = parts
  if (cachedId !== userId) return null
  if (Date.now() - Number(ts) > ROLE_TTL_MS) return null
  return role || null
}

function setCachedRole(response: NextResponse, userId: string, role: string | null): void {
  response.cookies.set(ROLE_COOKIE, `${userId}:${role ?? ''}:${Date.now()}`, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   5 * 60,
    path:     '/',
  })
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const subdomain = extractSubdomain(host)
  const { pathname } = request.nextUrl

  // ── app.kolusports.com rewriting ────────────────────────────────────────
  if (subdomain === 'app') {
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.rewrite(url)
    }

    if (
      !pathname.startsWith('/admin') &&
      !pathname.startsWith('/api') &&
      !pathname.startsWith('/_next') &&
      !pathname.startsWith('/platform') &&
      !APP_PASSTHROUGH.has(pathname)
    ) {
      const url = request.nextUrl.clone()
      url.pathname = `/admin${pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // ── Inject org slug from subdomain into request headers ─────────────────
  const orgSlug = getOrgSlugFromHostname(host)
  if (orgSlug) {
    request.headers.set('x-org-slug', orgSlug)
  }

  // ── Mark admin/platform/auth routes so the root layout skips DB calls ───
  const isAdminRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/platform') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  if (isAdminRoute) {
    request.headers.set('x-admin-route', '1')
  }

  let response = NextResponse.next({ request })

  // ── Add X-Robots-Tag for admin/platform pages ───────────────────────────
  if (pathname.startsWith('/admin') || pathname.startsWith('/platform')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
          // Re-apply X-Robots-Tag after response recreation
          if (pathname.startsWith('/admin') || pathname.startsWith('/platform')) {
            response.headers.set('X-Robots-Tag', 'noindex, nofollow')
          }
        },
      },
    }
  )

  // Re-validate JWT with Supabase Auth server (not just local session check)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Protect /admin/* routes ─────────────────────────────────────────────
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/admin/') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Role-based /admin/* access for authenticated users ──────────────────
  const needsRoleCheck =
    (pathname.startsWith('/admin/') && !!user) ||
    pathname.startsWith('/platform') ||
    (!!user && (pathname === '/login' || pathname === '/signup'))

  let profileRole: string | null = null
  if (needsRoleCheck && user) {
    // Check short-lived cookie first to avoid redundant DB call
    profileRole = getCachedRole(request, user.id)
    if (profileRole === null) {
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      profileRole = profile?.role ?? null
      setCachedRole(response, user.id, profileRole)
    }
  }

  // match_operator: restrict to /admin/operator only
  if (
    pathname.startsWith('/admin/') &&
    profileRole === 'match_operator' &&
    !pathname.startsWith('/admin/operator')
  ) {
    return NextResponse.redirect(new URL('/admin/operator', request.url))
  }

  // ── Protect /platform/* routes ──────────────────────────────────────────
  if (pathname.startsWith('/platform')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (profileRole !== 'power_admin') {
      const fallback = profileRole === 'match_operator' ? '/admin/operator' : '/admin/dashboard'
      return NextResponse.redirect(new URL(fallback, request.url))
    }
  }

  // ── Redirect authenticated users away from auth pages ───────────────────
  if (user && (pathname === '/login' || pathname === '/signup')) {
    if (profileRole === 'power_admin') {
      return NextResponse.redirect(new URL('/platform', request.url))
    } else if (profileRole === 'match_operator') {
      return NextResponse.redirect(new URL('/admin/operator', request.url))
    } else if (profileRole) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals, static files, and API routes
    '/((?!api/|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
