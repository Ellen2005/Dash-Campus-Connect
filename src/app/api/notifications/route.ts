import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = (searchParams.get("userId") ?? "").trim();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ notifications }, { status: 200 });
  } catch (e: any) {
    const msg = (e?.message ?? "").toString();
    return NextResponse.json({ error: `Failed to load notifications. ${msg}`.trim() }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = (body?.userId ?? "").trim();
    const notificationId = body?.notificationId ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId." }, { status: 400 });
    }

    if (notificationId) {
      // Mark specific notification as read
      await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true, readAt: new Date() },
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = (e?.message ?? "").toString();
    return NextResponse.json({ error: `Failed to mark notifications as read. ${msg}`.trim() }, { status: 500 });
  }
}
