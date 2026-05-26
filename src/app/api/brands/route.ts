import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  logo: z.string().url().optional(),
  sellerId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const sellerId = new URL(req.url).searchParams.get("sellerId");
  const brands = await prisma.brand.findMany({
    where: sellerId ? { sellerId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { listings: true } } },
  });
  return NextResponse.json({ brands });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const brand = await prisma.brand.create({ data: parsed.data });
  return NextResponse.json({ brand }, { status: 201 });
}
