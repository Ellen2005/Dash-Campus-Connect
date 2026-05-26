import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { listing: { select: { id: true, title: true, images: true, price: true } } } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = z.object({
    status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
    paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED"]).optional(),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const order = await prisma.order.update({ where: { id: orderId }, data: parsed.data });
  return NextResponse.json({ order });
}
