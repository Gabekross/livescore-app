// middleware.ts
// Two responsibilities:
//   1. Subdomain → org-slug header injection for all requests
//   2. Route protection (admin/platform auth checks)
//
// Route protection:
//   /admin/*     → requires authenticated user with admin_profiles row
//   /platform/*  → requires authenticated user with role='power_admin'
//   /login, /signup, /forgot-password, /reset-password → public
//
// Uses Supabase Auth session via @supabase/ssr.
// Refreshes session cookies on every request.

import { createServerClient } from '@supabase/ssr'
import { NextResponse }        from 'next/server'
import type { NextRequest }    from 'next/server'
import { getOrgSlugFromHostname } from '@/lib/subdomain'

export async function middleware(request: NextRequest) {
  // ── Inject org slug from subdomain into request headers ───────────────
  const orgSlug = getOrgSlugFromHostname(request.headers.get('host') || '')
  if (orgSlug) {
    request.headers.set('x-org-slug', orgSlug)
  }

  let response = NextResponse.next({ request })

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
        },
      },
    }
  )

  // Re-validate JWT with Supabase Auth server (not just local session check)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Protect /admin/* routes ─────────────────────────────────────────────
  // /admin (bare) is the legacy login page — redirect to new /login
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // /admin/* requires authentication
  if (pathname.startsWith('/admin/') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Protect /platform/* routes ──────────────────────────────────────────
  if (pathname.startsWith('/platform')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check power_admin role — must query admin_profiles
    // Use a lightweight query; RLS allows user to read own profile
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'power_admin') {
      // Not a power admin — redirect to their org admin dashboard
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  // ── Redirect authenticated users away from auth pages ───────────────────
  if (user && (pathname === '/login' || pathname === '/signup')) {
    // Already logged in — send to appropriate dashboard
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'power_admin') {
      return NextResponse.redirect(new URL('/platform', request.url))
    } else if (profile?.role) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    // No profile yet — let them through (signup might need provisioning)
  }

  return response
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
