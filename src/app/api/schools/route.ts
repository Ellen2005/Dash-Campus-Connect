import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SCHOOLS_CACHE_TTL = 300; // 5 minutes: schools list rarely changes

export async function GET(request: NextRequest) {
  // Rate limit: 30 requests per minute per IP
  const limiter = rateLimit(`schools:${ipFromRequest(request)}`, 30, 60_000);
  if (!limiter.allowed) return limiter.response;

  try {
    const schools = await prisma.school.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 500, // Hard limit to prevent overload
    });

    return NextResponse.json(
      { schools },
      {
        status: 200,
        headers: {
          "Cache-Control": `public, max-age=${SCHOOLS_CACHE_TTL}, s-maxage=${SCHOOLS_CACHE_TTL}`,
        },
      }
    );
  } catch (error) {
    console.error("[schools] DB error:", error);
    return NextResponse.json(
      { error: "Failed to load schools. Please retry." },
      { status: 503 }
    );
  }
}