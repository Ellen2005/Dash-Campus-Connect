import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SCHOOLS_CACHE_TTL = 300; // 5 minutes: schools list rarely changes

export async function GET() {
  try {
    const schools = await prisma.school.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 500,
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