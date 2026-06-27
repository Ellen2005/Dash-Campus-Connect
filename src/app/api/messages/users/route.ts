import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const q = (request.nextUrl.searchParams.get("q") ?? "").trim();

    const users = await prisma.user.findMany({
      where: {
        id: { not: auth.userId },
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
  } catch (e) {
    console.error("Failed to search users:", e);
    return NextResponse.json({ error: "Failed to search users." }, { status: 500 });
  }
}
