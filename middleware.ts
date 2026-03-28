import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "bible_session";

/**
 * Routes that require authentication.
 * Everything else is public (Bible text, search, dictionary, library, devotional).
 */
const PROTECTED_PREFIXES = [
  "/study",
  "/notes",
  "/api/notes",
  "/api/bookmarks",
  "/api/chat",
];

/** Routes that are always public, even if they match a protected prefix */
const PUBLIC_EXACT = ["/login", "/signup", "/api/auth/login", "/api/auth/signup", "/api/auth/logout"];

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("[Middleware] JWT_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isPublicExact(pathname: string): boolean {
  return PUBLIC_EXACT.some((p) => pathname === p || pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes
  if (!isProtected(pathname) || isPublicExact(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    // API routes get 401, page routes get redirected
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify JWT
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.userId) throw new Error("Missing userId in token");

    // Inject user info as headers for downstream consumption
    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.userId as string);
    return response;
  } catch {
    // Invalid/expired token — clear cookie and redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    // Match protected page routes
    "/study/:path*",
    "/notes/:path*",
    // Match protected API routes
    "/api/notes/:path*",
    "/api/bookmarks/:path*",
    "/api/chat/:path*",
  ],
};
