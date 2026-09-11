import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import type { UserRole } from "@ember-grain/shared";

/**
 * Route protection map. Anything not listed here (marketing pages, the
 * catalog, auth pages, public tracking) is public by default — this is a
 * deny-by-default *inside* the matcher below, not an allow-by-default over
 * the whole app, so new sensitive routes must be added explicitly.
 */
const ROUTE_RULES: Array<{ prefix: string; roles: UserRole[] | "any-auth" }> = [
  { prefix: "/", roles: ["ADMIN", "CUSTOMER"] },
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/portal/kitchen", roles: ["COOK", "ADMIN"] },
  { prefix: "/portal/driver", roles: ["DRIVER", "ADMIN"] },
  { prefix: "/cart", roles: "any-auth" },
  { prefix: "/checkout", roles: "any-auth" },
  { prefix: "/my-orders", roles: "any-auth" },
  // API mirrors of the above, enforced again at the handler for defense in depth.
  { prefix: "/api/admin", roles: ["ADMIN"] },
  { prefix: "/api/kitchen", roles: ["COOK", "ADMIN"] },
  { prefix: "/api/driver", roles: ["DRIVER", "ADMIN"] },
];

function matchRule(pathname: string) {
  return ROUTE_RULES.find((rule) => pathname.startsWith(rule.prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifySession(token) : null;

  if (pathname === "/login") {
    if (!claims) {
      return NextResponse.next();
    }

    const dashboardUrl =
      claims.role === "COOK"
        ? new URL("/portal/kitchen", request.url)
        : claims.role === "DRIVER"
          ? new URL("/portal/driver", request.url)
          : claims.role === "ADMIN"
            ? new URL("/admin/dashboard", request.url)
            : new URL("/", request.url);

    return NextResponse.redirect(dashboardUrl);
  }

  const rule = matchRule(pathname);
  if (!rule) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api/");

  if (!claims) {
    if (isApi) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "UNAUTHENTICATED", message: "Sign in required." },
        },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const authorized =
    rule.roles === "any-auth" || rule.roles.includes(claims.role);

  if (!authorized) {
    if (isApi) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "You don't have access to this resource.",
          },
        },
        { status: 403 },
      );
    }

    if (pathname === "/") {
      return NextResponse.redirect(new URL("/menu", request.url));
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/admin/:path*",
    "/portal/:path*",
    "/cart",
    "/checkout",
    "/my-orders",
    "/api/admin/:path*",
    "/api/kitchen/:path*",
    "/api/driver/:path*",
  ],
};
