import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'rh_auth';

const AUTH_ROUTES = ['/login', '/register'];
const PROTECTED_PREFIX = '/dashboard';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuth = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtected = pathname.startsWith(PROTECTED_PREFIX);

  if (pathname === '/') {
    return NextResponse.redirect(new URL(hasAuth ? '/dashboard' : '/login', request.url));
  }

  if (isProtected && !hasAuth) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/dashboard/:path*'],
};
