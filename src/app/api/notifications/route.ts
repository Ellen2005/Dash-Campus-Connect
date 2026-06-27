import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ notifications }, { status: 200 });
  } catch (e) {
    console.error("Failed to load notifications:", e);
    return NextResponse.json({ error: "Failed to load notifications." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json().catch(() => null);
    const notificationId = body?.notificationId;
    const markAllRead = body?.markAllRead;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: user.userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    if (!notificationId) {
      return NextResponse.json({ error: "Missing notificationId." }, { status: 400 });
    }

    await prisma.notification.update({
      where: { id: notificationId, userId: user.userId },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = (e?.message ?? "").toString();
    return NextResponse.json({ error: `Failed to update notification. ${msg}`.trim() }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json().catch(() => null);
    const notificationId = body?.notificationId;

    if (!notificationId) {
      return NextResponse.json({ error: "Missing notificationId." }, { status: 400 });
    }

    await prisma.notification.delete({
      where: { id: notificationId, userId: user.userId },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = (e?.message ?? "").toString();
    return NextResponse.json({ error: `Failed to delete notification. ${msg}`.trim() }, { status: 500 });
  }
}

