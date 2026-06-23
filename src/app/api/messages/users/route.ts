import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
    const currentUserId = (request.nextUrl.searchParams.get("currentUserId") ?? "").trim();
    if (!currentUserId) {
      return NextResponse.json({ error: "currentUserId is required." }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { username: { contains: q, mode: "insensitive" } },
                { fieldOfStudy: { name: { contains: q, mode: "insensitive" } } },
                { level: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        name: true,
        username: true,
        profilePhoto: true,
      },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (e: any) {
    const msg = (e?.message ?? "").toString();
    return NextResponse.json({ error: `Failed to search users. ${msg}`.trim() }, { status: 500 });
  }
}

