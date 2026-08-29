import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight route-guard: checks cookie presence only (fast, no DB call).
// Full session/permission validation happens in each page/action via
// lib/auth/session.ts and lib/auth/admin-session.ts.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasAdminSession = request.cookies.has("hm_admin_session");
    if (!hasAdminSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/minha-conta") || pathname.startsWith("/checkout")) {
    const hasSession = request.cookies.has("hm_session");
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/entrar";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/minha-conta/:path*", "/checkout/:path*"],
};
