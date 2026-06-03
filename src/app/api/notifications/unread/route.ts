import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = (searchParams.get("userId") ?? "").trim();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  try {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return NextResponse.json({ count }, { status: 200 });
  } catch (e: any) {
    // Log the error server-side for diagnostics but return a safe default
    console.error("/api/notifications/unread error:", e);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
