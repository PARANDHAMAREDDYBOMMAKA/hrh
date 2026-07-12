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
  const isCustomerSession = session?.user.role === "CUSTOMER";

  try {
    const { partnerId, customerName, customerPhone, roomNumber, items, deliverySlot, deliveryNotes } =
      await req.json();

    const name = (customerName ?? "").toString().trim();
    const phone = (customerPhone ?? "").toString().trim();

    if (!partnerId || !roomNumber || !items?.length || !deliverySlot) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
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
        customerId: isCustomerSession ? session!.user.id : null,
        customerName: name,
        customerPhone: phone,
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
      actor: session ? actorOf(session) : null,
      metadata: {
        orderNumber: order.orderNumber,
        partnerId,
        totalAmount,
        deliverySlot,
        itemCount: items.length,
        guest: !isCustomerSession,
      },
    });

    return NextResponse.json(
      { id: order.id, orderNumber: order.orderNumber, trackingToken: order.trackingToken },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
