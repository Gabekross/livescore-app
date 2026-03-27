// middleware.ts
// Protects all /admin/* routes (except /admin itself which is the login page).
// Uses Supabase Auth session via @supabase/ssr — replaces the old custom cookie check.
//
// The middleware also refreshes the session cookie on every request so it does not
// expire mid-session (required by @supabase/ssr).

import { createServerClient } from '@supabase/ssr'
import { NextResponse }        from 'next/server'
import type { NextRequest }    from 'next/server'

export async function middleware(request: NextRequest) {
  // Start with a pass-through response that we'll augment with refreshed cookies.
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
          // Write the cookies onto the request first (for downstream middleware)...
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // ...then recreate the response with the updated request so the cookies
          // are also forwarded to the browser.
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: always call getUser() (not getSession()) in middleware.
  // getUser() re-validates the JWT with the Supabase Auth server on every request,
  // preventing stale/forged session tokens from passing the check.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protect all admin sub-routes except the login page itself.
  // /admin  → login page (public)
  // /admin/ → also redirect to login page (avoids stale trailing-slash access)
  // /admin/anything → protected
  const isProtectedAdmin =
    pathname.startsWith('/admin/') ||
    (pathname === '/admin' && request.method !== 'GET') // allow GET to show login form

  if (pathname.startsWith('/admin/') && !user) {
    const loginUrl = new URL('/admin', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  // Run on all /admin routes. Use a broad matcher and check inside the function
  // for precision, so future admin sub-routes are automatically protected.
  matcher: ['/admin/:path+'],
}
