import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId");
  
  if (!schoolId) return NextResponse.json({ error: "schoolId required" }, { status: 400 });

  try {
    const levels = await prisma.level.findMany({
      where: { schoolId },
      orderBy: { order: "asc" },
      include: { _count: { select: { students: true } } },
    });
    return NextResponse.json({ levels });
  } catch (error) {
    console.error("Error fetching levels:", error);
    return NextResponse.json({ error: "Failed to fetch levels" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, order, schoolId } = body;
    
    if (!name || !schoolId) {
      return NextResponse.json({ error: "Name and schoolId required" }, { status: 400 });
    }

    const level = await prisma.level.create({
      data: { name, description, order: order || 0, schoolId },
    });
    return NextResponse.json({ level }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: "Level name already exists for this school" }, { status: 409 });
    }
    console.error("Error creating level:", error);
    return NextResponse.json({ error: "Failed to create level" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, order } = body;
    
    if (!id || !name) {
      return NextResponse.json({ error: "id and name required" }, { status: 400 });
    }

    const level = await prisma.level.update({
      where: { id },
      data: { name, description, order },
    });
    return NextResponse.json({ level });
  } catch (error) {
    console.error("Error updating level:", error);
    return NextResponse.json({ error: "Failed to update level" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    await prisma.level.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting level:", error);
    return NextResponse.json({ error: "Failed to delete level" }, { status: 500 });
  }
}