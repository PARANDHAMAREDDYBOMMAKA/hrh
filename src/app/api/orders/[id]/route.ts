import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      partner: { select: { name: true, address: true, phone: true } },
      customer: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "CUSTOMER" && order.customerId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  audit(req, {
    action: "ORDER_VIEW",
    entityType: "Order",
    entityId: order.id,
    actor: actorOf(session),
  });

  return NextResponse.json(order);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  const validStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({ where: { id }, select: { status: true } });

  const order = await prisma.order.update({
    where: { id },
    data: { status },
  });

  audit(req, {
    action: "ORDER_STATUS_UPDATE",
    entityType: "Order",
    entityId: order.id,
    actor: actorOf(session),
    metadata: { from: existing?.status ?? null, to: status },
  });

  return NextResponse.json(order);
}
