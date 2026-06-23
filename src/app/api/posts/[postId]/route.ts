import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true, name: true, profilePhoto: true, username: true },
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, profilePhoto: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        likes: { select: { userId: true, reaction: true } },
      },
    });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Verify session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Load post + verify authorization
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    // Check role from DB
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, isStudentAdmin: true },
    });

    const isAdmin = dbUser?.role === "ADMIN" || dbUser?.role === "SUPER_ADMIN";
    const isStudentAdmin = dbUser?.isStudentAdmin ?? false;
    const isAuthor = post.authorId === user.id;

    if (!isAuthor && !isAdmin && !isStudentAdmin) {
      return NextResponse.json({ error: "Not authorized to delete this post" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id: postId } });

    // Log deletion if done by admin/student admin
    if (!isAuthor && (isAdmin || isStudentAdmin)) {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "POST_DELETED_BY_ADMIN",
          resource: `post:${postId}`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
