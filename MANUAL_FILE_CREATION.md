# Manual File Creation Guide

If the automated setup scripts don't work in your environment, follow these steps to manually create the API files.

## Step 1: Create the Directories

Using your file explorer or terminal, create these directories:

```
src/app/api/admin/fields/
src/app/api/admin/levels/
src/app/api/admin/students/
src/app/api/communities/
src/app/api/auth/registration-fields/
```

## Step 2: Create Files with Content

Create a file named `route.ts` in each directory and copy the corresponding content below.

---

## File 1: src/app/api/admin/fields/route.ts

```typescript
import { prisma } from "@/lib/prisma";
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
```

---

## File 2: src/app/api/admin/levels/route.ts

[Content is similar to fields, replace FieldOfStudy with Level and createAutoCommunitiesForField with createAutoCommunitiesForLevel. For full content, see setup-all.js or setup-api-files.sh]

---

## File 3: src/app/api/admin/students/route.ts

[See setup-all.js or setup-api-files.sh for full content - implements GET with filters for schoolId, fieldId, levelId, and approvalStatus with pagination]

---

## File 4: src/app/api/communities/route.ts

[See setup-all.js or setup-api-files.sh for full content - implements GET for listing user communities or getting community details, and POST for creating new communities]

---

## File 5: src/app/api/auth/registration-fields/route.ts

[See setup-all.js or setup-api-files.sh for full content - implements GET endpoint for fetching available fields and levels for registration]

---

## Alternative: Use the Setup Scripts

For the complete, untruncated file contents, use one of the setup scripts:

### Option A: Run with Node.js (All platforms)
```bash
node setup-all.js
```

### Option B: Run with Bash (Linux/Mac/WSL)
```bash
bash setup-api-files.sh
```

The scripts will automatically create all directories and files with complete, properly formatted content.

---

## Verification

After creating the files, verify they exist:

```bash
# Linux/Mac
ls -la src/app/api/admin/fields/route.ts
ls -la src/app/api/admin/levels/route.ts
ls -la src/app/api/admin/students/route.ts
ls -la src/app/api/communities/route.ts
ls -la src/app/api/auth/registration-fields/route.ts

# Windows
dir src\app\api\admin\fields\route.ts
dir src\app\api\admin\levels\route.ts
dir src\app\api\admin\students\route.ts
dir src\app\api\communities\route.ts
dir src\app\api\auth\registration-fields\route.ts
```

Then run:
```bash
npm run lint
npm run typecheck
npm run build
```

All should pass without errors.
