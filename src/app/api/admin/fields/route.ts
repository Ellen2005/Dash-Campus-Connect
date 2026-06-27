import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin";

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId") || session.admin.school.id;

  if (!schoolId) return NextResponse.json({ error: "schoolId required" }, { status: 400 });

  try {
    const fields = await prisma.fieldOfStudy.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
      include: { _count: { select: { students: true } } },
    });
    return NextResponse.json({ fields });
  } catch (error) {
    console.error("Error fetching fields:", error);
    return NextResponse.json({ error: "Failed to fetch fields" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, description } = body;
    
    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const field = await prisma.fieldOfStudy.create({
      data: { name, description, schoolId: session.admin.school.id },
    });
    return NextResponse.json({ field }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: "Field name already exists for this school" }, { status: 409 });
    }
    console.error("Error creating field:", error);
    return NextResponse.json({ error: "Failed to create field" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { id, name, description } = body;
    
    if (!id || !name) {
      return NextResponse.json({ error: "id and name required" }, { status: 400 });
    }

    const field = await prisma.fieldOfStudy.findUnique({ where: { id }, select: { schoolId: true } });
    if (!field || field.schoolId !== session.admin.school.id) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    const updated = await prisma.fieldOfStudy.update({
      where: { id },
      data: { name, description },
    });
    return NextResponse.json({ field: updated });
  } catch (error) {
    console.error("Error updating field:", error);
    return NextResponse.json({ error: "Failed to update field" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const field = await prisma.fieldOfStudy.findUnique({ where: { id }, select: { schoolId: true } });
    if (!field || field.schoolId !== session.admin.school.id) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    await prisma.fieldOfStudy.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting field:", error);
    return NextResponse.json({ error: "Failed to delete field" }, { status: 500 });
  }
}
