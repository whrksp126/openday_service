import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// IMPORTANT: Middleware is NOT used for authentication.
// Auth is always verified directly in Server Components and API Routes.
// This prevents CVE-2025-29927 (x-middleware-subrequest header bypass).
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
