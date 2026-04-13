import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PARTNER" || !session.user.partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = session.user.partnerId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [partner, totalOrders, todayOrders, monthlyStats, activeOrders] =
    await Promise.all([
      prisma.partner.findUnique({
        where: { id: partnerId },
        select: { name: true, commissionRate: true, totalRooms: true },
      }),
      prisma.order.count({ where: { partnerId } }),
      prisma.order.count({
        where: { partnerId, createdAt: { gte: startOfDay } },
      }),
      prisma.order.aggregate({
        where: {
          partnerId,
          createdAt: { gte: startOfMonth },
          status: { not: "CANCELLED" },
        },
        _sum: { totalAmount: true, commissionAmount: true },
        _count: true,
      }),
      prisma.order.findMany({
        where: {
          partnerId,
          status: { notIn: ["DELIVERED", "CANCELLED"] },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { customer: { select: { name: true } } },
      }),
    ]);

  return NextResponse.json({
    partnerName: partner?.name || "",
    commissionRate: partner?.commissionRate || 0,
    totalRooms: partner?.totalRooms || 0,
    totalOrders,
    todayOrders,
    monthlyRevenue: monthlyStats._sum.totalAmount || 0,
    monthlyCommission: monthlyStats._sum.commissionAmount || 0,
    monthlyOrderCount: monthlyStats._count,
    activeOrders,
  });
}
