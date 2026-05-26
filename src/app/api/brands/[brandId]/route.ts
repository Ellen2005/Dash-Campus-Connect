import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  logo: z.string().url().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: { listings: { where: { status: "ACTIVE" }, take: 10 }, _count: { select: { listings: true } } },
  });
  if (!brand) return NextResponse.json({ error: "Brand not found." }, { status: 404 });
  return NextResponse.json({ brand });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const brand = await prisma.brand.update({ where: { id: brandId }, data: parsed.data });
  return NextResponse.json({ brand });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  await prisma.brand.delete({ where: { id: brandId } });
  return NextResponse.json({ success: true });
}
