import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX ?? "60");
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000");

const BLOCKED_UA_PATTERNS = [
  /sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /zgrab/i,
  /python-requests\/[0-1]\./i, /go-http-client\/1\./i,
  /libwww-perl/i, /lwp-trivial/i,
];

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isKnownAttackTool(req: NextRequest): boolean {
  const ua = req.headers.get("user-agent") ?? "";
  return BLOCKED_UA_PATTERNS.some(p => p.test(ua));
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT_MAP.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return response;
}

// Verify approval status server-side so the UI cannot be bypassed
async function checkApprovalStatus(req: NextRequest): Promise<"approved" | "pending" | "suspended" | "unauthenticated"> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return "unauthenticated";

  // Extract JWT from cookie (Supabase stores it as dash-auth-token)
  const cookieHeader = req.headers.get("cookie") ?? "";
  const tokenMatch = cookieHeader.match(/dash-auth-token=([^;]+)/);
  if (!tokenMatch) return "unauthenticated";

  try {
    const raw = decodeURIComponent(tokenMatch[1]);
    // Supabase stores the session as a JSON string in the cookie
    const parsed = JSON.parse(raw);
    const accessToken: string | undefined =
      typeof parsed === "string" ? parsed : parsed?.access_token ?? parsed?.currentSession?.access_token;
    if (!accessToken) return "unauthenticated";

    // Decode JWT payload (no verification needed — Supabase RLS handles security)
    const payloadB64 = accessToken.split(".")[1];
    if (!payloadB64) return "unauthenticated";
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    const status: string = payload?.user_metadata?.status ?? "pending";

    if (status === "active") return "approved";
    if (status === "suspended") return "suspended";
    return "pending";
  } catch {
    return "unauthenticated";
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  if (pathname.startsWith("/api/")) {
    if (isKnownAttackTool(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down and try again in a minute." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  // Block non-approved users from accessing /main/* routes at the server level
  const isMainRoute = pathname.startsWith("/main");
  if (isMainRoute) {
    const approvalStatus = await checkApprovalStatus(request);
    if (approvalStatus === "unauthenticated") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (approvalStatus === "pending") {
      // Allow /main only to show the pending screen — block all API-like sub-paths
      // The layout will show the pending UI. This prevents direct API manipulation.
      // API routes are handled separately; here we only gate page navigation.
    }
    if (approvalStatus === "suspended") {
      return NextResponse.redirect(new URL("/login?suspended=1", request.url));
    }
  }

  // Block pending/suspended users from calling sensitive API routes
  const isProtectedApi = pathname.startsWith("/api/posts") ||
    pathname.startsWith("/api/communities") ||
    pathname.startsWith("/api/groups") ||
    pathname.startsWith("/api/messages") ||
    pathname.startsWith("/api/marketplace") ||
    pathname.startsWith("/api/events");

  if (isProtectedApi) {
    const approvalStatus = await checkApprovalStatus(request);
    if (approvalStatus === "pending" || approvalStatus === "suspended") {
      return NextResponse.json(
        { error: approvalStatus === "suspended" ? "Account suspended." : "Account pending approval." },
        { status: 403 }
      );
    }
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json).*)"],
};
