import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  schoolId: z.string().min(1),
});

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const { schoolId } = QuerySchema.parse({
      schoolId: searchParams.get("schoolId"),
    });

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json(
        {
          success: false,
          error: "School not found",
        },
        { status: 404 }
      );
    }

    const [fields, levels] = await Promise.all([
      prisma.fieldOfStudy.findMany({
        where: { schoolId },
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.level.findMany({
        where: { schoolId },
        select: {
          id: true,
          name: true,
          description: true,
          order: true,
        },
        orderBy: { order: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        fields,
        levels,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters: " + error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    console.error("Error fetching registration fields:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch registration fields",
      },
      { status: 500 }
    );
  }
}
