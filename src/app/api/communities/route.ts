import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateCommunitySchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  photo: z.string().optional(),
});

const QuerySchema = z.object({
  userId: z.string().optional(),
  id: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const params = QuerySchema.parse({
      userId: searchParams.get("userId"),
      id: searchParams.get("id"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    // If community ID is provided, get community details
    if (params.id) {
      const community = await prisma.community.findUnique({
        where: { id: params.id },
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
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
          creator: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
            },
          },
          members: {
            take: 10,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profilePhoto: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      if (!community) {
        return NextResponse.json(
          {
            success: false,
            error: "Community not found",
          },
          { status: 404 }
        );
      }

      const isMember = params.userId
        ? !!(await prisma.communityMember.findUnique({
            where: {
              userId_communityId: {
                userId: params.userId,
                communityId: params.id,
              },
            },
          }))
        : false;

      return NextResponse.json({
        success: true,
        data: {
          ...community,
          isMember,
        },
      });
    }

    // Get user's communities
    if (!params.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "userId is required when not fetching by id",
        },
        { status: 400 }
      );
    }

    const skip = (params.page - 1) * params.limit;

    const [members, total] = await Promise.all([
      prisma.communityMember.findMany({
        where: { userId: params.userId },
        skip,
        take: params.limit,
        orderBy: { joinedAt: "desc" },
        include: {
          community: {
            include: {
              school: {
                select: {
                  id: true,
                  name: true,
                },
              },
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
              _count: {
                select: {
                  members: true,
                },
              },
            },
          },
        },
      }),
      prisma.communityMember.count({
        where: { userId: params.userId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        communities: members.map((m) => ({
          ...m.community,
          isMember: true,
          memberRole: m.role,
        })),
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

    console.error("Error fetching communities:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch communities",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json();
    const { userId, name, description, photo } = CreateCommunitySchema.parse(body);

    // Verify user exists and get their school
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, schoolId: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    if (!user.schoolId) {
      return NextResponse.json(
        {
          success: false,
          error: "User must belong to a school",
        },
        { status: 400 }
      );
    }

    const community = await prisma.community.create({
      data: {
        name,
        description,
        photo,
        type: "STUDENT_CREATED",
        schoolId: user.schoolId,
        creatorId: userId,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // Add creator as owner
    await prisma.communityMember.create({
      data: {
        userId,
        communityId: community.id,
        role: "OWNER",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: community,
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

    console.error("Error creating community:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create community",
      },
      { status: 500 }
    );
  }
}
