import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
  // Get session token from cookies
  const sessionCookie = request.cookies.get("better-auth.session_token")?.value

  // We should also check for secure cookie if running on HTTPS
  const secureCookie = request.cookies.get(
    "__Secure-better-auth.session_token"
  )?.value
  const token = sessionCookie || secureCookie

  if (!token) {
    const loginUrl =
      process.env.NEXT_PUBLIC_LOGIN_URL || "http://localhost:3000/login"
    return NextResponse.redirect(new URL(loginUrl))
  }

  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

    // Send the correct cookie name to the API
    const cookieHeader = secureCookie
      ? `__Secure-better-auth.session_token=${secureCookie}`
      : `better-auth.session_token=${token}`

    const response = await fetch(`${backendUrl}/api/auth/session-info`, {
      headers: {
        cookie: cookieHeader,
      },
    })

    if (!response.ok) {
      const loginUrl =
        process.env.NEXT_PUBLIC_LOGIN_URL || "http://localhost:3000/login"
      return NextResponse.redirect(new URL(loginUrl))
    }

    const data = await response.json()

    if (!data || !data.authenticated || !data.user) {
      const loginUrl =
        process.env.NEXT_PUBLIC_LOGIN_URL || "http://localhost:3000/login"
      return NextResponse.redirect(new URL(loginUrl))
    }

    const { pathname } = request.nextUrl
    const roles: string[] = data.user.roles || []
    const PORTAL_ROLES = [
      "MEMBER",
      "PASTORAL",
      "BOARD",
      "ADMIN",
      "SUPER_ADMIN",
    ]
    const hasPortalAccess = roles.some((r) => PORTAL_ROLES.includes(r))
    if (!hasPortalAccess) {
      const loginUrl =
        process.env.NEXT_PUBLIC_LOGIN_URL || "http://localhost:3000/login"
      const webUrl =
        process.env.NEXT_PUBLIC_WEB_URL || new URL(loginUrl).origin
      return NextResponse.redirect(new URL("/membership", webUrl))
    }

    if (pathname === "/") {
      if (roles.includes("SUPER_ADMIN")) {
        return NextResponse.redirect(new URL("/admin", request.url))
      }
      if (roles.includes("BOARD")) {
        return NextResponse.redirect(new URL("/board", request.url))
      }
      if (roles.includes("PASTORAL")) {
        return NextResponse.redirect(new URL("/pastoral", request.url))
      }
      if (roles.includes("MEMBER")) {
        return NextResponse.redirect(new URL("/general", request.url))
      }
    }

    if (pathname.startsWith("/admin") && !roles.includes("SUPER_ADMIN")) {
      return NextResponse.redirect(new URL("/forbidden", request.url))
    }

    if (
      pathname.startsWith("/board") &&
      !roles.includes("BOARD") &&
      !roles.includes("SUPER_ADMIN")
    ) {
      return NextResponse.redirect(new URL("/forbidden", request.url))
    }

    if (
      pathname.startsWith("/pastoral") &&
      !roles.includes("PASTORAL") &&
      !roles.includes("BOARD") &&
      !roles.includes("SUPER_ADMIN")
    ) {
      return NextResponse.redirect(new URL("/forbidden", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("[Middleware] Session check failed:", error)
    const loginUrl =
      process.env.NEXT_PUBLIC_LOGIN_URL || "http://localhost:3000/login"
    return NextResponse.redirect(new URL(loginUrl))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon file, or assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|assets|forbidden|help).*)",
  ],
}
