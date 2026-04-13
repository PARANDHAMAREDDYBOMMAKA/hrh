import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalOrders,
    todayOrders,
    monthlyRevenue,
    totalPartners,
    activePartners,
    totalCustomers,
    recentOrders,
    partnerStats,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth }, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true, commissionAmount: true },
      _count: true,
    }),
    prisma.partner.count(),
    prisma.partner.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        partner: { select: { name: true } },
        customer: { select: { name: true } },
      },
    }),
    prisma.partner.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { orders: true } },
        orders: {
          where: { createdAt: { gte: startOfMonth }, status: { not: "CANCELLED" } },
          select: { totalAmount: true, commissionAmount: true },
        },
      },
    }),
  ]);

  const partnerAnalytics = partnerStats.map((p) => ({
    id: p.id,
    name: p.name,
    totalOrders: p._count.orders,
    monthlyRevenue: p.orders.reduce((s, o) => s + o.totalAmount, 0),
    monthlyCommission: p.orders.reduce((s, o) => s + o.commissionAmount, 0),
  }));

  return NextResponse.json({
    totalOrders,
    todayOrders,
    monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
    monthlyCommission: monthlyRevenue._sum.commissionAmount || 0,
    monthlyOrderCount: monthlyRevenue._count,
    totalPartners,
    activePartners,
    totalCustomers,
    recentOrders,
    partnerAnalytics,
  });
}
