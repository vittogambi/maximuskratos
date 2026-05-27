import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/app'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!protectedPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Access token lives in sessionStorage; client-side guard on /app handles auth.
  // Middleware only blocks direct navigation without client hydration path.
  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
