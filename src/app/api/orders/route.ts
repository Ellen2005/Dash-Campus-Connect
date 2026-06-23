import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateOrderSchema = z.object({
  buyerId: z.string().min(1),
  paymentMethod: z.enum(["MOBILE_MONEY", "ORANGE_MONEY"]).default("MOBILE_MONEY"),
  phoneNumber: z.string().optional(),
  totalPrice: z.number().min(0).optional(),
  items: z.array(z.object({
    listingId: z.string().min(1),
    quantity: z.number().int().min(1),
    pricePerUnit: z.number().min(0),
  })).min(1),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buyerId = searchParams.get("buyerId");
  const sellerId = searchParams.get("sellerId");
  const status = searchParams.get("status");

  if (!buyerId && !sellerId) {
    return NextResponse.json({ error: "buyerId or sellerId required." }, { status: 400 });
  }

  let where: any = {};

  if (buyerId) where.buyerId = buyerId;
  if (status) where.status = status;

  // If sellerId, find orders that contain listings owned by this seller
  if (sellerId) {
    const listingIds = await prisma.marketplaceListing.findMany({
      where: { sellerId },
      select: { id: true },
    });
    where.items = {
      some: {
        listingId: { in: listingIds.map(l => l.id) },
      },
    };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { id: true, name: true, username: true, profilePhoto: true } },
      items: {
        include: {
          listing: { select: { id: true, title: true, images: true, price: true, sellerId: true, seller: { select: { id: true, name: true, username: true } } } },
        },
      },
    },
  });

  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const { buyerId, paymentMethod, items } = parsed.data;
  const totalPrice = items.reduce((sum, i) => sum + i.pricePerUnit * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      buyerId,
      totalPrice,
      paymentMethod,
      status: "PENDING",
      paymentStatus: "PENDING",
      items: { create: items },
    },
    include: { items: true },
  });

  // Clear cart after order
  const cart = await prisma.shoppingCart.findUnique({ where: { userId: buyerId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  return NextResponse.json({ order }, { status: 201 });
}