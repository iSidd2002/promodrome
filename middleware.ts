import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Allow access to auth pages and public assets
    if (
      pathname.startsWith('/auth/') ||
      pathname.startsWith('/api/auth/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/timer-worker.js') ||
      pathname === '/manifest.json'
    ) {
      return NextResponse.next()
    }

    // Redirect unauthenticated users from protected pages to sign-in
    if (!token) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(signInUrl)
    }

    // Allow authenticated users to access all pages
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Always allow access to auth pages and public assets
        if (
          pathname.startsWith('/auth/') ||
          pathname.startsWith('/api/auth/') ||
          pathname.startsWith('/_next/') ||
          pathname.startsWith('/favicon.ico') ||
          pathname.startsWith('/timer-worker.js') ||
          pathname === '/manifest.json'
        ) {
          return true
        }

        // For all other pages, require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - timer-worker.js (Web Worker file)
     * - manifest.json (PWA manifest)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|timer-worker.js|manifest.json).*)',
  ],
}
