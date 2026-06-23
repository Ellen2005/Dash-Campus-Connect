import { NextRequest, NextResponse } from "next/server";

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

export function proxy(request: NextRequest) {
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

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json).*)"],
};
