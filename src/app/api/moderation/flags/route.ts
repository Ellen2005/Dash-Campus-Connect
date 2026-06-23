import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateFlagSchema = z.object({
  postId: z.string().optional(),
  listingId: z.string().optional(),
  reason: z.string().min(1).max(500),
  details: z.string().max(2000).optional(),
  reporterId: z.string().optional(),
}).refine((d) => d.postId || d.listingId, {
  message: "Either postId or listingId must be provided",
});

async function getSession() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

async function getSchoolScope(session: any): Promise<string | null> {
  if (!session?.user) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolId: true, role: true, isStudentAdmin: true },
    });
    if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") return null; // super admin sees all
    if (user?.isStudentAdmin) return user.schoolId;
    return user?.schoolId || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  const schoolScope = await getSchoolScope(session);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING";
  const schoolId = searchParams.get("schoolId") || schoolScope;

  try {
    const where: any = { status: status as any };
    if (schoolId) where.schoolId = schoolId;

    const flags = await prisma.moderatorFlag.findMany({
      where,
      include: {
        post: {
          include: {
            author: {
              select: { id: true, name: true, username: true, schoolId: true },
            },
          },
        },
        listing: {
          include: {
            seller: {
              select: { id: true, name: true, username: true },
            },
          },
        },
        reporter: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const normalizedFlags = flags.map((f) => ({
      id: f.id,
      reason: f.reason,
      status: f.status,
      contentSnapshot: f.contentSnapshot,
      contentType: f.postId ? "post" : "listing",
      contentId: f.postId || f.listingId,
      content: f.post?.content?.substring(0, 200) || f.listing?.title || "",
      user: f.post?.author
        ? { name: f.post.author.name, username: f.post.author.username || "unknown" }
        : f.listing?.seller
        ? { name: f.listing.seller.name, username: f.listing.seller.username || "unknown" }
        : { name: "Unknown", username: "unknown" },
      reporter: f.reporter
        ? { name: f.reporter.name, username: f.reporter.username || "unknown" }
        : null,
      createdAt: f.createdAt.toISOString(),
      resolvedAt: f.resolvedAt?.toISOString() || null,
    }));

    return NextResponse.json({ flags: normalizedFlags });
  } catch (error) {
    console.error("[moderation/flags] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch flagged content" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Any authenticated user can submit a report
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = CreateFlagSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { postId, listingId, reason, details } = parsed.data;

    // Capture a content snapshot for the audit trail
    let contentSnapshot: string | undefined;
    let schoolId: string | undefined;

    if (postId) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { content: true, author: { select: { schoolId: true } } },
      });
      if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
      contentSnapshot = post.content.substring(0, 500);
      schoolId = post.author?.schoolId ?? undefined;

      // Mark post as flagged
      await prisma.post.update({ where: { id: postId }, data: { isFlagged: true } });
    }

    if (listingId) {
      const listing = await prisma.marketplaceListing.findUnique({
        where: { id: listingId },
        select: { title: true, description: true, seller: { select: { schoolId: true } } },
      });
      if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      contentSnapshot = `${listing.title}: ${listing.description?.substring(0, 400)}`;
      schoolId = listing.seller?.schoolId ?? undefined;

      // Mark listing as flagged
      await prisma.marketplaceListing.update({ where: { id: listingId }, data: { isFlagged: true } });
    }

    const fullReason = details ? `${reason}: ${details}` : reason;

    const flag = await prisma.moderatorFlag.create({
      data: {
        postId,
        listingId,
        reason: fullReason,
        contentSnapshot,
        reporterId: user.id,
        schoolId,
        status: "PENDING",
      },
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "REPORT_CONTENT",
        resource: postId ? `post:${postId}` : `listing:${listingId}`,
      },
    });

    return NextResponse.json({ flag, success: true }, { status: 201 });
  } catch (error) {
    console.error("[moderation/flags POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}