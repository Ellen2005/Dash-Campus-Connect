import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.errorResponse) return NextResponse.json({ count: 0 });

    const count = await prisma.notification.count({
      where: { userId: auth.userId, isRead: false },
    });

    return NextResponse.json({ count }, {
      headers: { 'Cache-Control': 'public, max-age=10, s-maxage=15, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}