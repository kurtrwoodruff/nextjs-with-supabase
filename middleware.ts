import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/mode-select", "/dashboard", "/matches", "/settings"];

export async function middleware(request: NextRequest) {
  // Keep Supabase session sync
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Skip public routes
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets")
  ) {
    return response;
  }

  // Check if user is authenticated by looking for Supabase cookies
  const hasSession =
    request.cookies.has("sb-access-token") ||
    request.cookies.has("sb-refresh-token");

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!.*\\.).*)"], // apply middleware to all routes except static files
};
