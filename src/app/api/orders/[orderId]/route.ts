import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/require-user";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { listing: { select: { id: true, title: true, images: true, price: true, sellerId: true } } } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (order.buyerId !== auth.userId) {
    const sellerIds = order.items.map(i => i.listing.sellerId);
    if (!sellerIds.includes(auth.userId) && auth.dbUser.role !== "ADMIN" && auth.dbUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
  }

  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, buyerId: true, items: { select: { listing: { select: { sellerId: true } } } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Only the buyer or the seller of any item can update
  const isBuyer = order.buyerId === auth.userId;
  const isSeller = order.items.some(i => i.listing.sellerId === auth.userId);
  if (!isBuyer && !isSeller && auth.dbUser.role !== "ADMIN" && auth.dbUser.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z.object({
    status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
    paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED"]).optional(),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const updated = await prisma.order.update({ where: { id: orderId }, data: parsed.data });
  return NextResponse.json({ order: updated });
}
