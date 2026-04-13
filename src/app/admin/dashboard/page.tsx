"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  TrendingUp,
  Building2,
  Users,
  IndianRupee,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

const statusConfig: Record<string, { label: string; bg: string; dot: string }> = {
  PENDING: { label: "Pending", bg: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
  CONFIRMED: { label: "Confirmed", bg: "bg-blue-50 text-blue-700", dot: "bg-blue-400" },
  PREPARING: { label: "Preparing", bg: "bg-purple-50 text-purple-700", dot: "bg-purple-400" },
  READY: { label: "Ready", bg: "bg-teal-50 text-teal-700", dot: "bg-teal-400" },
  OUT_FOR_DELIVERY: { label: "On the way", bg: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-400" },
  DELIVERED: { label: "Delivered", bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
  CANCELLED: { label: "Cancelled", bg: "bg-red-50 text-red-700", dot: "bg-red-400" },
};

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => fetch("/api/crm/analytics").then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[120px] rounded-2xl bg-white animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-white animate-pulse" />
      </div>
    );
  }

  const stats = [
    { label: "Total Orders", value: data?.totalOrders || 0, icon: ShoppingBag, iconBg: "bg-orange-500", iconColor: "text-white" },
    { label: "Today's Orders", value: data?.todayOrders || 0, icon: Clock, iconBg: "bg-blue-500", iconColor: "text-white" },
    { label: "Monthly Revenue", value: `₹${(data?.monthlyRevenue || 0).toLocaleString()}`, icon: IndianRupee, iconBg: "bg-emerald-500", iconColor: "text-white" },
    { label: "Commissions", value: `₹${(data?.monthlyCommission || 0).toLocaleString()}`, icon: TrendingUp, iconBg: "bg-violet-500", iconColor: "text-white" },
    { label: "Active Partners", value: `${data?.activePartners || 0}/${data?.totalPartners || 0}`, icon: Building2, iconBg: "bg-pink-500", iconColor: "text-white" },
    { label: "Customers", value: data?.totalCustomers || 0, icon: Users, iconBg: "bg-indigo-500", iconColor: "text-white" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="p-5 rounded-2xl bg-white border border-black/[0.04] hover:border-black/[0.08] transition-colors duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] text-foreground/35 font-medium">{stat.label}</p>
                <p className="text-[1.6rem] font-bold mt-1.5 tracking-tight text-foreground">{stat.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl bg-white border border-black/[0.04] overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-foreground tracking-tight">Recent Orders</h2>
          <Link href="/admin/orders" className="text-[13px] text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 transition-colors">
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] text-foreground/25 font-semibold uppercase tracking-wider border-t border-black/[0.04]">
                <th className="px-6 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentOrders?.map(
                (order: { id: string; orderNumber: string; customer: { name: string }; partner: { name: string }; deliverySlot: string; totalAmount: number; status: string }) => {
                  const config = statusConfig[order.status] || statusConfig.PENDING;
                  return (
                    <tr key={order.id} className="border-t border-black/[0.03] hover:bg-black/[0.01] transition-colors duration-200">
                      <td className="px-6 py-3.5 text-[13px] font-mono font-medium text-foreground/50">#{order.orderNumber?.slice(-6)}</td>
                      <td className="px-4 py-3.5 text-[13px] text-foreground/60">{order.customer?.name}</td>
                      <td className="px-4 py-3.5 text-[13px] text-foreground/60">{order.partner?.name}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] px-2 py-1 rounded-md bg-orange-50 text-orange-600 font-medium">{order.deliverySlot}</span>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-semibold text-foreground">₹{order.totalAmount}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md font-medium ${config.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                          {config.label}
                        </span>
                      </td>
                    </tr>
                  );
                }
              )}
              {(!data?.recentOrders || data.recentOrders.length === 0) && (
                <tr><td colSpan={6} className="p-12 text-center text-foreground/25 text-[13px]">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
