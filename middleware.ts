import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 🎯 NEW APPROACH: Allow access to all routes by default
  // Authentication is now OPTIONAL for enhanced features only

  // Only protect specific API routes that require user data
  const protectedApiRoutes = [
    '/api/user/settings',
    '/api/sessions',
    '/api/stats/daily'
  ]

  // Check if this is a protected API route that requires authentication
  if (protectedApiRoutes.some(route => pathname.startsWith(route))) {
    // For protected API routes, check for authentication
    const sessionCookie = request.cookies.get('next-auth.session-token') ||
                         request.cookies.get('__Secure-next-auth.session-token')

    if (!sessionCookie) {
      // Return 401 for API routes that require auth, but don't redirect
      return new NextResponse(
        JSON.stringify({
          error: 'Authentication required for this feature',
          message: 'Please sign in to save your data and access personalized features'
        }),
        {
          status: 401,
          headers: { 'content-type': 'application/json' }
        }
      )
    }
  }

  // Allow ALL other requests to proceed without authentication
  // This includes:
  // - Main timer page (/)
  // - All timer functionality
  // - Auth pages (/auth/*)
  // - Public API routes
  // - Static assets
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Only run middleware on API routes that might need protection
     * All other routes are now freely accessible
     */
    '/api/((?!auth|register|test-db).*)',
  ],
}
