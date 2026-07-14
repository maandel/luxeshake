/**
 * Next.js Middleware — server-side route protection.
 *
 * Runs at the Edge BEFORE the page renders. This is the only reliable way to
 * protect routes — client-side JS guards alone can be bypassed.
 *
 * Strategy:
 * - Admin routes (/luxe-control/*) require the refresh_token HttpOnly cookie.
 * - Public customer pages are always accessible.
 * - Redirects preserve the intended destination for post-login redirect.
 */

import { NextRequest, NextResponse } from "next/server";

/** Routes that require authentication (the refresh_token cookie must exist). */
const PROTECTED_PREFIXES = ["/luxe-control/dashboard", "/luxe-control/users", "/luxe-control/orders", "/luxe-control/products", "/luxe-control/delivery", "/luxe-control/settings", "/luxe-control/tickets", "/luxe-control/site-content", "/luxe-control/change-password"];

/** The login page for the admin panel. */
const ADMIN_LOGIN = "/luxe-control";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route requires protection
  const requiresAuth = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!requiresAuth) {
    return NextResponse.next();
  }

  // The refresh_token is an HttpOnly cookie set by the backend.
  // Its presence is a strong (but not infallible) signal that the user is authenticated.
  // The actual token validation always happens server-side in the backend.
  const hasSession = request.cookies.has("refresh_token");

  if (!hasSession) {
    const loginUrl = new URL(ADMIN_LOGIN, request.url);
    // Preserve intended destination for post-login redirect
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all routes EXCEPT:
   * - Next.js internals (_next/static, _next/image)
   * - API routes
   * - Favicon
   * - Static assets
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
