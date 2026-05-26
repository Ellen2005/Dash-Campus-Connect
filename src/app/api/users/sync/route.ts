import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SyncUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().optional(),
  fullName: z.string().min(1),
  username: z.string().min(1),
  faculty: z.string().optional(),
  year: z.string().optional(),
  avatar: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = SyncUserSchema.parse(body);

    const email = data.email ?? `${data.username}@dash-campus.app`;

    const user = await prisma.user.upsert({
      where: { id: data.id },
      update: {
        email,
        name: data.fullName,
        username: data.username,
        major: data.faculty ?? undefined,
        year: data.year ?? undefined,
        profilePhoto: data.avatar ?? undefined,
      },
      create: {
        id: data.id,
        email,
        name: data.fullName,
        username: data.username,
        major: data.faculty ?? undefined,
        year: data.year ?? undefined,
        profilePhoto: data.avatar ?? undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        major: true,
        year: true,
        profilePhoto: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error syncing user profile:", error);
    return NextResponse.json({ error: "Failed to sync user profile" }, { status: 500 });
  }
}
