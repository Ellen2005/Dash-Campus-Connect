import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/require-user";

const CreateOrderSchema = z.object({
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
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(req.url);
  const sellerId = searchParams.get("sellerId");
  const status = searchParams.get("status");

  let where: Record<string, unknown> = {};

  // Users see their own orders; sellers see orders for their listings
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
  } else {
    where.buyerId = auth.userId;
  }

  if (status) where.status = status;

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
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  const body = await req.json().catch(() => null);
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const { paymentMethod, items } = parsed.data;
  const totalPrice = items.reduce((sum, i) => sum + i.pricePerUnit * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      buyerId: auth.userId,
      totalPrice,
      paymentMethod,
      status: "PENDING",
      paymentStatus: "PENDING",
      items: { create: items },
    },
    include: { items: true },
  });

  const cart = await prisma.shoppingCart.findUnique({ where: { userId: auth.userId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  return NextResponse.json({ order }, { status: 201 });
}
