import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Edge-safe route protection. Real authorization (role checks, tenant scoping)
// still happens again in each API route / server component via requireUser().
const PROTECTED_PREFIXES = ["/dashboard", "/customers", "/tickets", "/settings"];

async function hasValidSession(req: NextRequest) {
  const token = req.cookies.get("trakwell_session")?.value;
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const valid = await hasValidSession(req);
  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/customers/:path*", "/tickets/:path*", "/settings/:path*"],
};
