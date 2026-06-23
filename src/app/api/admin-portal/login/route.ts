import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createAdminSession } from "@/lib/admin-session";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  schoolId: z.string().min(2).max(24),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
  }

  const schoolId = parsed.data.schoolId.trim().toLowerCase();
  const password = parsed.data.password;

  let admin: any;
  try {
    admin = await prisma.adminAccount.findUnique({
      where: { schoolId },
      include: { school: true },
    });
  } catch {
    return NextResponse.json({ error: "Database not configured. Set DATABASE_URL and run Prisma migrations." }, { status: 500 });
  }

  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return NextResponse.json({ error: "Incorrect School ID or password." }, { status: 401 });
  }

  await createAdminSession(admin.id);

  return NextResponse.json(
    { success: true, school: { id: admin.school.id, name: admin.school.name }, admin: { id: admin.id, name: admin.name } },
    { status: 200 }
  );
}

