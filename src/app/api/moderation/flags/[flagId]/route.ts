import { prisma } from "@/lib/prisma";
import { requireAdminOrStudentAdmin } from "@/lib/require-admin-or-student-admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

const BodySchema = z.object({
  status: z.enum(["PENDING", "UNDER_REVIEW", "APPROVED", "DISMISSED", "RESOLVED"]),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  const { user, errorResponse } = await requireAdminOrStudentAdmin();
  if (errorResponse) return errorResponse;

  try {
    const { flagId } = await params;
    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const flag = await prisma.moderatorFlag.update({
      where: { id: flagId },
      data: {
        status: parsed.data.status,
        resolvedBy: user?.id,
        resolvedAt: ["DISMISSED", "RESOLVED", "APPROVED"].includes(parsed.data.status) ? new Date() : undefined,
      },
    });

    // Log the moderation action
    if (user?.id) {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: `FLAG_${parsed.data.status}`,
          resource: `flag:${flagId}`,
        },
      });
    }

    return NextResponse.json({ flag, success: true });
  } catch (error) {
    console.error("[moderation/flags/[flagId]] Error:", error);
    return NextResponse.json({ error: "Failed to update flag" }, { status: 500 });
  }
}

// Remove content associated with a flag
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  const { user, errorResponse } = await requireAdminOrStudentAdmin();
  if (errorResponse) return errorResponse;

  try {
    const { flagId } = await params;

    const flag = await prisma.moderatorFlag.findUnique({
      where: { id: flagId },
      include: {
        post: { select: { id: true, authorId: true, content: true } },
        listing: { select: { id: true, sellerId: true, title: true } },
      },
    });

    if (!flag) return NextResponse.json({ error: "Flag not found" }, { status: 404 });

    // Soft-delete (hide) the content
    if (flag.postId && flag.post) {
      await prisma.post.update({
        where: { id: flag.postId },
        data: { isFlagged: true }, // Content remains hidden/flagged
      });

      // Notify the author
      try {
        await createNotification({
          userId: flag.post.authorId,
          type: "MODERATION_ACTION",
          title: "Content Removed",
          message: "A post you made was removed by a campus moderator for violating community guidelines.",
          actionUrl: "/main",
        });
      } catch { /* non-critical */ }
    }

    if (flag.listingId && flag.listing) {
      await prisma.marketplaceListing.update({
        where: { id: flag.listingId },
        data: { status: "REMOVED", isFlagged: true },
      });

      // Notify the seller
      try {
        await createNotification({
          userId: flag.listing.sellerId,
          type: "MODERATION_ACTION",
          title: "Listing Removed",
          message: `Your listing "${flag.listing.title}" was removed by a campus moderator.`,
          actionUrl: "/main/marketplace",
        });
      } catch { /* non-critical */ }
    }

    // Mark flag as resolved
    await prisma.moderatorFlag.update({
      where: { id: flagId },
      data: {
        status: "RESOLVED",
        resolvedBy: user?.id,
        resolvedAt: new Date(),
      },
    });

    // Log the action
    if (user?.id) {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "CONTENT_REMOVED",
          resource: `flag:${flagId}`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[moderation/flags/[flagId] DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to remove content" }, { status: 500 });
  }
}