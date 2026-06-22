"use client";

import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Clock, IndianRupee, Package, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface ActiveOrder {
  id: string;
  orderNumber: string;
  roomNumber: string;
  deliverySlot: string;
  status: string;
  totalAmount: number;
  items: { name: string; quantity: number; price: number }[];
  createdAt: string;
  customer: { name: string };
}

const statusConfig: Record<string, { label: string; bg: string; dot: string }> = {
  PENDING: { label: "Pending", bg: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
  CONFIRMED: { label: "Confirmed", bg: "bg-blue-50 text-blue-700", dot: "bg-blue-400" },
  PREPARING: { label: "Preparing", bg: "bg-purple-50 text-purple-700", dot: "bg-purple-400" },
  READY: { label: "Ready", bg: "bg-teal-50 text-teal-700", dot: "bg-teal-400" },
  OUT_FOR_DELIVERY: { label: "On the way", bg: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-400" },
};

export default function PartnerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["partner-analytics"],
    queryFn: () => fetch("/api/partner/analytics").then((r) => r.json()),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="h-24 rounded-2xl bg-white animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[110px] rounded-2xl bg-white animate-pulse" />
          ))}
        </div>
        <div className="h-60 rounded-2xl bg-white animate-pulse" />
      </div>
    );
  }

  const stats = [
    { label: "Today's Orders", value: data?.todayOrders || 0, icon: Clock, iconBg: "bg-blue-500" },
    { label: "Total Orders", value: data?.totalOrders || 0, icon: ShoppingBag, iconBg: "bg-orange-500" },
    { label: "Monthly Revenue", value: `₹${(data?.monthlyCommission || 0).toLocaleString()}`, icon: IndianRupee, iconBg: "bg-emerald-500" },
  ];

  const activeOrders: ActiveOrder[] = data?.activeOrders || [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome */}
      <div className="p-6 rounded-2xl bg-foreground text-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <h1 className="text-xl font-bold tracking-tight">Welcome back, {data?.partnerName || "Partner"}</h1>
          <p className="text-background/40 text-[13px] mt-1">
            Commission rate: {Math.abs(data?.commissionRate ?? 0)}% &middot; {data?.totalRooms ?? 0} rooms
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="p-5 rounded-2xl bg-white border border-black/[0.04] hover:border-black/[0.08] transition-colors duration-300">
            <div className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center mb-3`}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-[1.4rem] font-bold tracking-tight text-foreground">{stat.value}</div>
            <div className="text-[11px] text-foreground/30 font-medium mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Active orders */}
      <div className="rounded-2xl bg-white border border-black/[0.04] overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-foreground tracking-tight">Active Orders</h2>
              <p className="text-[11px] text-foreground/25">{activeOrders.length} in progress</p>
            </div>
          </div>
          <Link href="/partner/orders" className="text-[13px] text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 transition-colors">
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeOrders.length === 0 ? (
          <div className="p-14 text-center border-t border-black/[0.03]">
            <Package className="w-8 h-8 mx-auto text-foreground/10 mb-3" />
            <p className="text-foreground/25 text-[13px] font-medium">No active orders right now</p>
            <p className="text-foreground/15 text-[11px] mt-1">New orders will appear here</p>
          </div>
        ) : (
          <div>
            {activeOrders.map((order, i) => {
              const config = statusConfig[order.status] || statusConfig.PENDING;
              return (
                <div key={order.id} className={`px-6 py-4 hover:bg-black/[0.01] transition-colors duration-200 ${i > 0 ? "border-t border-black/[0.03]" : "border-t border-black/[0.03]"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[13px] font-semibold text-foreground/60">#{order.orderNumber?.slice(-6)}</span>
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium ${config.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
                          {config.label}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 font-medium">{order.deliverySlot}</span>
                      </div>
                      <div className="mt-1.5 text-[13px] text-foreground/35">{order.customer?.name} &middot; Room {order.roomNumber}</div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(order.items as { name: string; quantity: number }[]).map((item, j) => (
                          <span key={j} className="text-[10px] px-2 py-0.5 rounded bg-black/[0.03] text-foreground/40 font-medium">{item.quantity}x {item.name}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[15px] font-bold tracking-tight">₹{order.totalAmount}</div>
                      <div className="text-[11px] text-foreground/20 mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
