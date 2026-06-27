import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function DELETE(request: NextRequest) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const resource = await prisma.libraryResource.findUnique({
      where: { id },
      select: { uploadedById: true },
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (resource.uploadedById !== auth.userId && auth.dbUser.role !== "ADMIN" && auth.dbUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Not authorized to delete this resource" }, { status: 403 });
    }

    await prisma.libraryResource.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting library resource:", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
