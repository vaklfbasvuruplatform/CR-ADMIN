import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that don't require authentication
const publicPaths = ['/login', '/api/auth/login', '/api/auth/dmn-login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('auth_token')?.value;
  if (token) {
    return NextResponse.next();
  }

  // dmn cookie kontrolü — Node.js JWT üretemeyiz, API route'a yönlendir
  const dmnCookie = request.cookies.get('dmn')?.value;
  if (dmnCookie === 'dmn') {
    const redirectBack = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search);
    const autoLoginUrl = new URL(`/api/auth/dmn-login?redirect=${redirectBack}`, request.url);
    return NextResponse.redirect(autoLoginUrl);
  }

  // Token yok, dmn cookie de yok → login sayfasına yönlendir
  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
