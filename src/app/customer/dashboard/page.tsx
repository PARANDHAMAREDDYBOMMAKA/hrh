"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ShoppingBag, Clock, Package, ArrowUpRight, User, Mail, Phone } from "lucide-react";

interface OrderItem { name: string; quantity: number; price: number }

interface Order {
  id: string; orderNumber: string; deliverySlot: string; status: string;
  totalAmount: number; items: OrderItem[]; roomNumber: string;
  createdAt: string; partner: { name: string };
}

interface UserProfile {
  id: string; name: string; email: string; phone: string | null;
  role: string; createdAt: string; _count: { orders: number };
}

const statusConfig: Record<string, { label: string; bg: string; dot: string }> = {
  PENDING: { label: "Pending", bg: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
  CONFIRMED: { label: "Confirmed", bg: "bg-blue-50 text-blue-700", dot: "bg-blue-400" },
  PREPARING: { label: "Preparing", bg: "bg-purple-50 text-purple-700", dot: "bg-purple-400" },
  READY: { label: "Ready", bg: "bg-teal-50 text-teal-700", dot: "bg-teal-400" },
  OUT_FOR_DELIVERY: { label: "On the way", bg: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-400" },
  DELIVERED: { label: "Delivered", bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
  CANCELLED: { label: "Cancelled", bg: "bg-red-50 text-red-700", dot: "bg-red-400" },
};

export default function CustomerDashboard() {
  const { data: session } = useSession();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["customer-profile"],
    queryFn: () => fetch("/api/customer/profile").then((r) => r.json()),
  });

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["my-orders"],
    queryFn: () => fetch("/api/orders").then((r) => r.json()),
  });

  const activeOrders = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
  const totalSpent = orders.filter((o) => o.status === "DELIVERED").reduce((s, o) => s + o.totalAmount, 0);
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-5">
      {/* User profile card */}
      <div className="p-5 rounded-2xl bg-foreground text-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/[0.03] rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 text-[18px] font-bold">
            {(profile?.name || session?.user?.name || "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold tracking-tight truncate">
              {profile?.name || session?.user?.name}
            </h1>
            <div className="flex flex-col gap-1 mt-1.5">
              <div className="flex items-center gap-2 text-[12px] text-background/40">
                <Mail className="w-3 h-3" />
                <span className="truncate">{profile?.email || session?.user?.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-2 text-[12px] text-background/40">
                  <Phone className="w-3 h-3" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>
            {profile?.createdAt && (
              <div className="text-[10px] text-background/20 mt-2">
                Member since {new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { icon: ShoppingBag, value: orders.length, label: "Orders", iconBg: "bg-orange-500" },
          { icon: Clock, value: activeOrders.length, label: "Active", iconBg: "bg-blue-500" },
          { icon: Package, value: deliveredCount, label: "Delivered", iconBg: "bg-emerald-500" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-2xl bg-white border border-black/[0.04] text-center">
            <div className={`w-8 h-8 mx-auto rounded-lg ${stat.iconBg} flex items-center justify-center mb-2`}>
              <stat.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="text-xl font-bold tracking-tight">{stat.value}</div>
            <div className="text-[10px] text-foreground/25 font-semibold uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Total spent */}
      {totalSpent > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-black/[0.04] flex items-center justify-between">
          <span className="text-[13px] text-foreground/40">Total spent</span>
          <span className="text-[16px] font-bold tracking-tight">₹{totalSpent.toLocaleString()}</span>
        </div>
      )}

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="font-semibold text-[11px] text-foreground/25 uppercase tracking-wider">Active Now</h2>
          {activeOrders.slice(0, 3).map((order) => {
            const config = statusConfig[order.status] || statusConfig.PENDING;
            return (
              <div key={order.id} className="p-4 rounded-2xl bg-white border border-black/[0.04]">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium ${config.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
                      {config.label}
                    </span>
                    <span className="text-[11px] text-foreground/20 font-medium">{order.deliverySlot}</span>
                  </div>
                  <span className="font-bold text-[13px] tracking-tight">₹{order.totalAmount}</span>
                </div>
                <div className="text-[13px] text-foreground/35">{order.partner?.name} &middot; Room {order.roomNumber}</div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(order.items as OrderItem[]).slice(0, 4).map((item, j) => (
                    <span key={j} className="text-[10px] px-2 py-0.5 rounded bg-black/[0.03] text-foreground/30 font-medium">{item.quantity}x {item.name}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-foreground/70">Recent Orders</h2>
          {orders.length > 0 && (
            <Link href="/customer/orders" className="text-[13px] text-orange-500 hover:text-orange-600 flex items-center gap-1 font-medium transition-colors">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2.5">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white animate-pulse" />)}</div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-14 rounded-2xl bg-white border border-black/[0.04]">
            <ShoppingBag className="w-8 h-8 mx-auto text-foreground/10 mb-3" />
            <p className="text-foreground/25 text-[13px] font-medium">No orders yet</p>
            <p className="text-foreground/15 text-[11px] mt-1">Scan a QR code at your hostel to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => {
              const config = statusConfig[order.status] || statusConfig.PENDING;
              return (
                <div key={order.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-black/[0.04] hover:border-black/[0.08] transition-colors duration-200">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-foreground/60 truncate">{order.partner?.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${config.bg}`}>{config.label}</span>
                    </div>
                    <div className="text-[11px] text-foreground/20 mt-0.5">{order.deliverySlot} &middot; {new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className="font-bold text-[13px] ml-3 tracking-tight">₹{order.totalAmount}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
