import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const type = searchParams.get("type");
    const q = searchParams.get("q");

    if (!schoolId) {
      return NextResponse.json({ error: "schoolId required" }, { status: 400 });
    }

    const where: any = { schoolId };
    if (type) where.type = type;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    // Check if libraryResource model exists in the schema
    if (!prisma.libraryResource) {
      console.warn("[library] libraryResource model not found in Prisma client, returning empty");
      return NextResponse.json({ resources: [] });
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type, description, url, content, schoolId, uploadedById } = body;

    if (!title || !type || !schoolId || !uploadedById) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!prisma.libraryResource) {
      return NextResponse.json({ error: "Library feature not yet available in database" }, { status: 503 });
    }

    const resource = await prisma.libraryResource.create({
      data: {
        title,
        type,
        description,
        url,
        content,
        schoolId,
        uploadedById,
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