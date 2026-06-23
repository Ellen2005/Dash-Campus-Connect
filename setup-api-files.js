const fs = require('fs');
const path = require('path');

const baseDir = process.cwd();

// Ensure directories exist
const dirs = [
  'src/app/api/admin/fields',
  'src/app/api/admin/levels',
  'src/app/api/admin/students',
  'src/app/api/communities',
  'src/app/api/auth/registration-fields'
];

dirs.forEach(dir => {
  const fullPath = path.join(baseDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);
  }
});

// File contents
const files = {
  'src/app/api/admin/fields/route.ts': `import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { createAutoCommunitiesForField } from "@/lib/communities";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateFieldSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const UpdateFieldSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { session, errorResponse } = await requireAdminSession();
    if (errorResponse) return errorResponse;

    const schoolId = session.admin.schoolId;

    const fields = await prisma.fieldOfStudy.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: fields,
    });
  } catch (error) {
    console.error("Error fetching fields:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch fields",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { session, errorResponse } = await requireAdminSession();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { name, description } = CreateFieldSchema.parse(body);

    const schoolId = session.admin.schoolId;

    // Check for duplicate
    const existing = await prisma.fieldOfStudy.findFirst({
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
          error: "A field with this name already exists",
        },
        { status: 400 }
      );
    }

    const field = await prisma.fieldOfStudy.create({
      data: {
        name,
        description,
        schoolId,
      },
    });

    // Auto-create communities for this field
    await createAutoCommunitiesForField(schoolId, field.id, field.name);

    return NextResponse.json(
      {
        success: true,
        data: field,
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

    console.error("Error creating field:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create field",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { session, errorResponse } = await requireAdminSession();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const fieldId = body.id;

    if (!fieldId) {
      return NextResponse.json(
        {
          success: false,
          error: "Field ID is required",
        },
        { status: 400 }
      );
    }

    const { name, description } = UpdateFieldSchema.parse(body);
    const schoolId = session.admin.schoolId;

    // Verify field belongs to school
    const field = await prisma.fieldOfStudy.findUnique({
      where: { id: fieldId },
    });

    if (!field || field.schoolId !== schoolId) {
      return NextResponse.json(
        {
          success: false,
          error: "Field not found",
        },
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current field)
    if (name !== field.name) {
      const existing = await prisma.fieldOfStudy.findFirst({
        where: {
          schoolId,
          name: {
            equals: name,
            mode: "insensitive",
          },
          id: { not: fieldId },
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: "A field with this name already exists",
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.fieldOfStudy.update({
      where: { id: fieldId },
      data: {
        name,
        description,
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

    console.error("Error updating field:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update field",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { session, errorResponse } = await requireAdminSession();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const fieldId = searchParams.get("id");

    if (!fieldId) {
      return NextResponse.json(
        {
          success: false,
          error: "Field ID is required",
        },
        { status: 400 }
      );
    }

    const schoolId = session.admin.schoolId;

    // Verify field belongs to school
    const field = await prisma.fieldOfStudy.findUnique({
      where: { id: fieldId },
    });

    if (!field || field.schoolId !== schoolId) {
      return NextResponse.json(
        {
          success: false,
          error: "Field not found",
        },
        { status: 404 }
      );
    }

    // Delete field and associated communities (cascade will handle it)
    await prisma.fieldOfStudy.delete({
      where: { id: fieldId },
    });

    return NextResponse.json({
      success: true,
      data: { id: fieldId },
    });
  } catch (error) {
    console.error("Error deleting field:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete field",
      },
      { status: 500 }
    );
  }
}
`,

  'src/app/api/admin/levels/route.ts': `import { prisma } from "@/lib/prisma";
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

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
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

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
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

export async function PUT(req: NextRequest): Promise<NextResponse<ApiResponse>> {
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

export async function DELETE(req: NextRequest): Promise<NextResponse<ApiResponse>> {
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
`,

  'src/app/api/admin/students/route.ts': `import { prisma } from "@/lib/prisma";
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

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
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
`,

  'src/app/api/communities/route.ts': `import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateCommunitySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  photo: z.string().optional(),
});

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await getServerSession();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("id");

    // If community ID is provided, get community details
    if (communityId) {
      const community = await prisma.community.findUnique({
        where: { id: communityId },
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

      // Check if user is member
      const isMember = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: user.id,
            communityId,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          ...community,
          isMember: !!isMember,
        },
      });
    }

    // Otherwise, get user's communities
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [communities, total] = await Promise.all([
      prisma.communityMember.findMany({
        where: { userId: user.id },
        skip,
        take: limit,
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
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        communities: communities.map((m) => m.community),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
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
    const user = await getServerSession();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 }
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

    const body = await req.json();
    const { name, description, photo } = CreateCommunitySchema.parse(body);

    const community = await prisma.community.create({
      data: {
        name,
        description,
        photo,
        type: "STUDENT_CREATED",
        schoolId: user.schoolId,
        creatorId: user.id,
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
        userId: user.id,
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
`,

  'src/app/api/auth/registration-fields/route.ts': `import { prisma } from "@/lib/prisma";
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
`
};

// Create all files
Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(baseDir, filePath);
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created file: ${fullPath}`);
});

console.log('\\nAll API route files created successfully!');
