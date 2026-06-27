import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const FilterSchema = z.object({
  schoolId: z.string().optional(),
  fieldId: z.string().optional(),
  levelId: z.string().optional(),
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdminSession();
    if (errorResponse) return errorResponse;

    const adminSchoolId = session.admin.schoolId;

    const params = FilterSchema.parse({
      schoolId: req.nextUrl.searchParams.get("schoolId"),
      fieldId: req.nextUrl.searchParams.get("fieldId"),
      levelId: req.nextUrl.searchParams.get("levelId"),
      approvalStatus: req.nextUrl.searchParams.get("approvalStatus"),
      page: req.nextUrl.searchParams.get("page"),
      limit: req.nextUrl.searchParams.get("limit"),
    });

    // Verify schoolId matches admin's school
    if (params.schoolId && params.schoolId !== adminSchoolId) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only access your school's students",
        },
        { status: 403 }
      );
    }

    const where: any = {
      schoolId: adminSchoolId,
    };

    if (params.fieldId) {
      where.fieldOfStudyId = params.fieldId;
    }

    if (params.levelId) {
      where.levelId = params.levelId;
    }

    if (params.approvalStatus) {
      where.approvalStatus = params.approvalStatus;
    }

    const skip = (params.page - 1) * params.limit;

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: params.limit,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          profilePhoto: true,
          schoolId: true,
          fieldOfStudy: {
            select: {
              id: true,
              name: true,
            },
          },
          level: {
            select: {
              id: true,
              name: true,
            },
          },
          approvalStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        students,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          pages: Math.ceil(total / params.limit),
        },
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

    console.error("Error fetching students:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch students",
      },
      { status: 500 }
    );
  }
}
