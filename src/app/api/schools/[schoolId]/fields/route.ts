import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { schoolId: string } }
) {
  try {
    const { schoolId } = await params;
    const fields = await prisma.fieldOfStudy.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        _count: { select: { students: true } },
      },
    });
    return NextResponse.json({ fields });
  } catch (error) {
    console.error("[fields-by-school] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fields" },
      { status: 500 }
    );
  }
}