import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = await prisma.order.findUnique({
    where: { trackingToken: token },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      roomNumber: true,
      deliverySlot: true,
      deliveryNotes: true,
      customerName: true,
      items: true,
      totalAmount: true,
      createdAt: true,
      partner: { select: { name: true, address: true, phone: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(order);
}
