import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Halaman di dalam aplikasi butuh cookie login. Keabsahan token tetap dicek backend Go.
export function middleware(req: NextRequest) {
  if (!req.cookies.get("token")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/select-company", "/change-password"],
};
