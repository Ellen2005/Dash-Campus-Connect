import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId") || auth.dbUser.schoolId;
    const type = searchParams.get("type");
    const q = searchParams.get("q");

    if (!schoolId) {
      return NextResponse.json({ error: "schoolId required" }, { status: 400 });
    }

    const where: Record<string, unknown> = { schoolId };
    if (type) where.type = type;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const resources = await prisma.libraryResource.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        uploadedBy: {
          select: { id: true, name: true, username: true, profilePhoto: true },
        },
      },
    });

    return NextResponse.json({ resources });
  } catch (e) {
    console.error("Error fetching library resources:", e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

const CreateSchema = z.object({
  title: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  url: z.string().optional(),
  content: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    if (!auth.dbUser.schoolId) {
      return NextResponse.json({ error: "No school assigned to your account." }, { status: 400 });
    }

    const resource = await prisma.libraryResource.create({
      data: {
        title: parsed.data.title,
        type: parsed.data.type,
        description: parsed.data.description,
        url: parsed.data.url,
        content: parsed.data.content,
        schoolId: auth.dbUser.schoolId,
        uploadedById: auth.userId,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, username: true, profilePhoto: true },
        },
      },
    });

    return NextResponse.json({ resource });
  } catch (e) {
    console.error("Error creating library resource:", e);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
