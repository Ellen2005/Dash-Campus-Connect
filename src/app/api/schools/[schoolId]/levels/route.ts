import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { schoolId: string } }
) {
  try {
    const { schoolId } = await params;
    const levels = await prisma.level.findMany({
      where: { schoolId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        order: true,
        _count: { select: { students: true } },
      },
    });
    return NextResponse.json({ levels });
  } catch (error) {
    console.error("[levels-by-school] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch levels" },
      { status: 500 }
    );
  }
}