// /middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const loggedIn = request.cookies.get('admin_logged_in')?.value

  const protectedPaths = [
    '/admin/dashboard',
    '/admin/tournaments',
    '/admin/teams',
    '/admin/matches',
    // 🔥 Add other admin-only routes here
  ]

  const pathname = request.nextUrl.pathname

  const isProtected = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtected && loggedIn !== 'true') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

// Configures which paths the middleware should run on
export const config = {
  matcher: [
    '/admin/dashboard',
    '/admin/tournaments',
    '/admin/teams',
    '/admin/matches',
    // 🔥 Add the same paths here as well
  ],
}
