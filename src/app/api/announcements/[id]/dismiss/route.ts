import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    // For now, we'll store dismissed announcements in user metadata
    // In a future migration, create an AnnouncementDismissal table
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { notificationPrefs: true },
    });

    const prefs = (dbUser?.notificationPrefs as any) || {};
    const dismissed = Array.isArray(prefs.dismissedAnnouncements) ? prefs.dismissedAnnouncements : [];
    
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      await prisma.user.update({
        where: { id: user.userId },
        data: {
          notificationPrefs: {
            ...prefs,
            dismissedAnnouncements: dismissed,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[announcements/dismiss] Error:", error);
    return NextResponse.json({ error: "Failed to dismiss" }, { status: 500 });
  }
}