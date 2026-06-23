import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  schoolName: z.string().min(3).max(120),
  schoolId: z.string().min(2).max(24).regex(/^[a-z0-9]+$/, "schoolId must be lowercase letters and numbers only"),
  country: z.string().max(120).optional(),
  adminName: z.string().min(2).max(120),
  password: z.string().min(8).max(200),
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
    return NextResponse.json({ error: parsed.error.errors.map(e => e.message).join(", ") }, { status: 400 });
  }

  const { schoolName, schoolId, country, adminName, password } = parsed.data;

  try {
    // Hint: this endpoint requires DATABASE_URL to point to a *working* Postgres instance
    // with valid credentials for the prisma connection user.
    // When credentials are wrong, Prisma throws P1000 (authentication failed).
    const school = await prisma.school.create({
      data: {
        id: schoolId,
        name: schoolName.trim(),
        country: country?.trim() || null,
        admin: {
          create: {
            name: adminName.trim(),
            passwordHash: hashPassword(password),
          },
        },
      },
      include: { admin: true },
    });

    return NextResponse.json(
      {
        success: true,
        school: { id: school.id, name: school.name },
        admin: { id: school.admin?.id, name: school.admin?.name },
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("[admin-portal/register-school]", {
      code: e?.code,
      message: e?.message,
      meta: e?.meta,
    });
    const raw = (e?.message ?? "").toString();
    const msg = raw.toLowerCase();
    const code = (e?.code ?? "").toString();
    const isUnique = msg.includes("unique") || msg.includes("duplicate") || code === "P2002";
    const isDns = msg.includes("eai_again") || msg.includes("getaddrinfo");
    const isAuth = code === "P1000" || msg.includes("authentication failed") || msg.includes("password");
    const unreachable =
      code === "P1001" ||
      msg.includes("can't reach database") ||
      msg.includes("econnrefused") ||
      isDns;
    const missingTable = (code === "P2021" || msg.includes("does not exist")) && !isAuth;
    return NextResponse.json(
      {
        error: isUnique
          ? "That School ID is already taken. Please choose another."
          : isAuth
            ? "Database authentication failed. Check your DATABASE_URL credentials in .env.local."
            : isDns
              ? "Database host lookup failed. Check your DATABASE_URL host and DNS/network access."
              : unreachable
                ? "Database is unreachable. Check DATABASE_URL and network access."
                : missingTable
                  ? "Database schema is missing. Run the SQL bootstrap script (prisma/manual-init.sql) in Supabase SQL Editor."
                  : `Failed to register school: ${raw}`.trim(),
      },
      { status: isUnique ? 409 : isDns ? 503 : 500 },
    );
  }
}

