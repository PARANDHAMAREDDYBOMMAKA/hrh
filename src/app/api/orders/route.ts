import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = session.user.role === "ADMIN"
    ? {}
    : { customerId: session.user.id };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      partner: { select: { name: true } },
      customer: { select: { name: true, email: true } },
    },
    take: 100,
  });

  audit(req, {
    action: "ORDERS_VIEW",
    entityType: "Order",
    actor: actorOf(session),
  });

  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Only customers can place orders" }, { status: 403 });
  }

  try {
    const { partnerId, roomNumber, items, deliverySlot, deliveryNotes } = await req.json();

    if (!partnerId || !roomNumber || !items?.length || !deliverySlot) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner || !partner.isActive) {
      return NextResponse.json({ error: "Partner not found or inactive" }, { status: 404 });
    }

    const totalAmount = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );
    const commissionAmount = Math.abs(totalAmount * (partner.commissionRate / 100));

    const order = await prisma.order.create({
      data: {
        partnerId,
        customerId: session.user.id,
        roomNumber: roomNumber.trim(),
        deliveryNotes: deliveryNotes?.trim() || null,
        items,
        totalAmount,
        deliverySlot,
        commissionAmount,
      },
    });

    audit(req, {
      action: "ORDER_CREATE",
      entityType: "Order",
      entityId: order.id,
      actor: actorOf(session),
      metadata: {
        orderNumber: order.orderNumber,
        partnerId,
        totalAmount,
        deliverySlot,
        itemCount: items.length,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
