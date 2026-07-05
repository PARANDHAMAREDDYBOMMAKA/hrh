import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PARTNER" || !session.user.partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  audit(req, {
    action: "PARTNER_ORDERS_VIEW",
    entityType: "Order",
    actor: actorOf(session),
    metadata: { partnerId: session.user.partnerId },
  });

  const orders = await prisma.order.findMany({
    where: { partnerId: session.user.partnerId },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
    },
    take: 100,
  });

  return NextResponse.json(orders);
}
