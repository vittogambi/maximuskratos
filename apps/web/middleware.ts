import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // Auth guards run client-side (sessionStorage + refresh cookie).
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/app/:path*'],
};
