import { NextResponse, type NextRequest } from "next/server";
import { getCSPHeader } from "@/lib/middleware-utils";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static assets, icons, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|otf)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Read authenticated role from secure cookie
  const sessionCookie = request.cookies.get("attendex_demo_session")?.value?.toUpperCase();
  const studentRoll = request.cookies.get("attendex_student_roll")?.value;

  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";
  const isLandingPage = pathname === "/";
  const isPublicRoute = isAuthPage || isLandingPage || pathname.startsWith("/api/");

  const response = NextResponse.next({ request });

  // 3. Apply Institutional Security Headers (CSP, FrameGuard, NoSniff)
  response.headers.set("Content-Security-Policy", getCSPHeader());
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");

  // 4. Handle Unauthenticated Requests to Protected Routes
  if (!sessionCookie && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Handle Already-Authenticated Users Visiting Login Page
  if (sessionCookie && isAuthPage) {
    const destination = 
      sessionCookie === "STUDENT" ? "/student/dashboard" :
      sessionCookie === "PARENT" ? "/parent/dashboard" :
      sessionCookie === "PRINCIPAL" ? "/principal" :
      sessionCookie === "SUPER_ADMIN" ? "/super-admin" : "/dashboard";

    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = destination;
    return NextResponse.redirect(targetUrl);
  }

  // 6. Strict Multi-Tenant Role-Based Access Boundaries (Prevent Profile Interception)
  if (sessionCookie) {
    // ─── STUDENT ISOLATION ────────────────────────────────────────────────
    if (sessionCookie === "STUDENT") {
      // Students can ONLY access /student/* or public routes
      if (
        pathname.startsWith("/parent") ||
        pathname.startsWith("/principal") ||
        pathname.startsWith("/super-admin") ||
        pathname.startsWith("/attendance") ||
        pathname.startsWith("/results/manage") ||
        pathname.startsWith("/subjects") ||
        pathname === "/dashboard"
      ) {
        const studentUrl = request.nextUrl.clone();
        studentUrl.pathname = "/student/dashboard";
        return NextResponse.redirect(studentUrl);
      }
    }

    // ─── PARENT ISOLATION ─────────────────────────────────────────────────
    else if (sessionCookie === "PARENT") {
      // Parents can ONLY access /parent/* or public routes
      if (
        pathname.startsWith("/student") ||
        pathname.startsWith("/principal") ||
        pathname.startsWith("/super-admin") ||
        pathname.startsWith("/attendance") ||
        pathname.startsWith("/results/manage") ||
        pathname.startsWith("/subjects") ||
        pathname === "/dashboard"
      ) {
        const parentUrl = request.nextUrl.clone();
        parentUrl.pathname = "/parent/dashboard";
        return NextResponse.redirect(parentUrl);
      }
    }

    // ─── TEACHER ISOLATION ────────────────────────────────────────────────
    else if (sessionCookie === "TEACHER") {
      // Teachers cannot access student personal portals, parent portals, or principal/super-admin
      if (
        pathname.startsWith("/student") ||
        pathname.startsWith("/parent") ||
        pathname.startsWith("/principal") ||
        pathname.startsWith("/super-admin")
      ) {
        const teacherUrl = request.nextUrl.clone();
        teacherUrl.pathname = "/dashboard";
        return NextResponse.redirect(teacherUrl);
      }
    }

    // ─── PRINCIPAL ISOLATION ──────────────────────────────────────────────
    else if (sessionCookie === "PRINCIPAL") {
      // Principals cannot access student or parent personal portals
      if (
        pathname.startsWith("/student") ||
        pathname.startsWith("/parent") ||
        pathname.startsWith("/super-admin")
      ) {
        const principalUrl = request.nextUrl.clone();
        principalUrl.pathname = "/principal";
        return NextResponse.redirect(principalUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|icons|globals\\.css|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|otf)$).*)",
  ],
};
