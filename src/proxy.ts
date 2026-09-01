import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getCSPHeader } from "@/lib/middleware-utils";

export async function proxy(request: NextRequest) {

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Refresh session (CRITICAL)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Security Headers (CSP, Frame Options, etc.)
  supabaseResponse.headers.set("Content-Security-Policy", getCSPHeader());
  supabaseResponse.headers.set("X-Frame-Options", "DENY");
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 3. Auth Guard & Routing
  const { pathname } = request.nextUrl;
  const isAuthPage   = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";
  const isPublicPage = pathname === "/" || pathname === "/privacy" || pathname === "/terms";
  const isApiRoute   = pathname.startsWith("/api/");

  const demoSession = request.cookies.get("attendex_demo_session")?.value;
  const isAuthenticated = Boolean(user || demoSession);

  // Never redirect API routes — they handle their own auth
  if (!isApiRoute && !isAuthenticated && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Preserve the intended destination so login can redirect back
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isAuthPage) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get("next");

    if (next && next.startsWith("/") && !next.startsWith("//")) {
      url.pathname = next;
      url.searchParams.delete("next");
      return NextResponse.redirect(url);
    }

    const effectiveRole = (user ? (user.user_metadata?.role || "TEACHER") : (demoSession || "TEACHER")).toUpperCase();

    if (effectiveRole === "SUPER_ADMIN" || effectiveRole === "SUPERADMIN") url.pathname = "/super-admin";
    else if (effectiveRole === "PRINCIPAL") url.pathname = "/principal";
    else if (effectiveRole === "STUDENT") url.pathname = "/student/dashboard";
    else if (effectiveRole === "PARENT") url.pathname = "/parent/dashboard";
    else url.pathname = "/dashboard";

    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static, _next/image  (Next.js internals)
     * - favicon.ico, manifest.json (PWA / browser metadata)
     * - sw.js                      (service worker)
     * - icons/, .well-known/       (PWA icons + browser special paths)
     * - globals.css                (public CSS)
     * - static file extensions     (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|icons|globals\\.css|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|otf)$).*)",
  ],
};
