import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { createAutoCommunitiesForLevel } from "@/lib/communities";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateLevelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  order: z.number().int().default(0),
});

const UpdateLevelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  order: z.number().int(),
});

type ApiResponse<T = any> = { success: boolean; data?: T; error?: string };

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { session, errorResponse } = await requireAdminSession();
    if (errorResponse) return errorResponse;

    const schoolId = session.admin.schoolId;

    const levels = await prisma.level.findMany({
      where: { schoolId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: levels,
    });
  } catch (error) {
    console.error("Error fetching levels:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch levels",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { session, errorResponse } = await requireAdminSession();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { name, description, order } = CreateLevelSchema.parse(body);

    const schoolId = session.admin.schoolId;

    // Check for duplicate
    const existing = await prisma.level.findFirst({
      where: {
        schoolId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "A level with this name already exists",
        },
        { status: 400 }
      );
    }

    const level = await prisma.level.create({
      data: {
        name,
        description,
        order,
        schoolId,
      },
    });

    // Auto-create communities for this level
    await createAutoCommunitiesForLevel(schoolId, level.id, level.name);

    return NextResponse.json(
      {
        success: true,
        data: level,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input: " + error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    console.error("Error creating level:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create level",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { session, errorResponse } = await requireAdminSession();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const levelId = body.id;

    if (!levelId) {
      return NextResponse.json(
        {
          success: false,
          error: "Level ID is required",
        },
        { status: 400 }
      );
    }

    const { name, description, order } = UpdateLevelSchema.parse(body);
    const schoolId = session.admin.schoolId;

    // Verify level belongs to school
    const level = await prisma.level.findUnique({
      where: { id: levelId },
    });

    if (!level || level.schoolId !== schoolId) {
      return NextResponse.json(
        {
          success: false,
          error: "Level not found",
        },
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current level)
    if (name !== level.name) {
      const existing = await prisma.level.findFirst({
        where: {
          schoolId,
          name: {
            equals: name,
            mode: "insensitive",
          },
          id: { not: levelId },
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: "A level with this name already exists",
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.level.update({
      where: { id: levelId },
      data: {
        name,
        description,
        order,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input: " + error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    console.error("Error updating level:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update level",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { session, errorResponse } = await requireAdminSession();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const levelId = searchParams.get("id");

    if (!levelId) {
      return NextResponse.json(
        {
          success: false,
          error: "Level ID is required",
        },
        { status: 400 }
      );
    }

    const schoolId = session.admin.schoolId;

    // Verify level belongs to school
    const level = await prisma.level.findUnique({
      where: { id: levelId },
    });

    if (!level || level.schoolId !== schoolId) {
      return NextResponse.json(
        {
          success: false,
          error: "Level not found",
        },
        { status: 404 }
      );
    }

    // Delete level and associated communities (cascade will handle it)
    await prisma.level.delete({
      where: { id: levelId },
    });

    return NextResponse.json({
      success: true,
      data: { id: levelId },
    });
  } catch (error) {
    console.error("Error deleting level:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete level",
      },
      { status: 500 }
    );
  }
}
