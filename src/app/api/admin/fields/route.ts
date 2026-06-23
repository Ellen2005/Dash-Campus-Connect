import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId");
  
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
  try {
    const body = await request.json();
    const { name, description, schoolId } = body;
    
    if (!name || !schoolId) {
      return NextResponse.json({ error: "Name and schoolId required" }, { status: 400 });
    }

    const field = await prisma.fieldOfStudy.create({
      data: { name, description, schoolId },
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
  try {
    const body = await request.json();
    const { id, name, description } = body;
    
    if (!id || !name) {
      return NextResponse.json({ error: "id and name required" }, { status: 400 });
    }

    const field = await prisma.fieldOfStudy.update({
      where: { id },
      data: { name, description },
    });
    return NextResponse.json({ field });
  } catch (error) {
    console.error("Error updating field:", error);
    return NextResponse.json({ error: "Failed to update field" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    await prisma.fieldOfStudy.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting field:", error);
    return NextResponse.json({ error: "Failed to delete field" }, { status: 500 });
  }
}