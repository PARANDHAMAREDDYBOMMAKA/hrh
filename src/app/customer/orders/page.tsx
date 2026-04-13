"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";

interface OrderItem { name: string; quantity: number; price: number }

interface Order {
  id: string; orderNumber: string; roomNumber: string; deliverySlot: string;
  status: string; totalAmount: number; items: OrderItem[]; createdAt: string;
  partner: { name: string };
}

const statusFlow = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

const statusStyle: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: "Pending", bg: "bg-amber-500", text: "text-amber-700 bg-amber-50" },
  CONFIRMED: { label: "Confirmed", bg: "bg-blue-500", text: "text-blue-700 bg-blue-50" },
  PREPARING: { label: "Preparing", bg: "bg-purple-500", text: "text-purple-700 bg-purple-50" },
  READY: { label: "Ready", bg: "bg-teal-500", text: "text-teal-700 bg-teal-50" },
  OUT_FOR_DELIVERY: { label: "On the way", bg: "bg-indigo-500", text: "text-indigo-700 bg-indigo-50" },
  DELIVERED: { label: "Delivered", bg: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50" },
  CANCELLED: { label: "Cancelled", bg: "bg-red-500", text: "text-red-700 bg-red-50" },
};

export default function CustomerOrdersPage() {
  const [filter, setFilter] = useState<"active" | "past">("active");

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["my-orders"],
    queryFn: () => fetch("/api/orders").then((r) => r.json()),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-white animate-pulse" />)}
      </div>
    );
  }

  const activeOrders = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
  const pastOrders = orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status));
  const displayed = filter === "active" ? activeOrders : pastOrders;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold tracking-tight">My Orders</h2>
        <p className="text-foreground/25 text-[13px] mt-0.5">{orders.length} total</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-black/[0.04] w-fit">
        <button onClick={() => setFilter("active")} className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-300 ${filter === "active" ? "bg-foreground text-background" : "text-foreground/30"}`}>
          Active {activeOrders.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-md bg-orange-500 text-white text-[10px] font-bold">{activeOrders.length}</span>}
        </button>
        <button onClick={() => setFilter("past")} className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-300 ${filter === "past" ? "bg-foreground text-background" : "text-foreground/30"}`}>
          Past
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white border border-black/[0.04]">
          <ShoppingBag className="w-8 h-8 mx-auto text-foreground/10 mb-3" />
          <p className="text-foreground/25 text-[13px] font-medium">No orders yet</p>
          <p className="text-foreground/15 text-[11px] mt-1">Scan a QR code at your hostel to get started</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white border border-black/[0.04]">
          <p className="text-foreground/25 text-[13px] font-medium">No {filter} orders</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((order) => {
            const config = statusStyle[order.status] || statusStyle.PENDING;
            const isActive = !["DELIVERED", "CANCELLED"].includes(order.status);
            const currentIdx = statusFlow.indexOf(order.status);

            return (
              <div key={order.id} className="rounded-2xl bg-white border border-black/[0.04] overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-foreground/25">#{order.orderNumber?.slice(-6)}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${config.text}`}>{config.label}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 font-medium">{order.deliverySlot}</span>
                    </div>
                    <span className="font-bold text-[14px] tracking-tight">₹{order.totalAmount}</span>
                  </div>

                  <div className="text-[13px] text-foreground/35">{order.partner?.name} &middot; Room {order.roomNumber}</div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {(order.items as OrderItem[]).map((item, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-black/[0.03] text-foreground/30 font-medium">{item.quantity}x {item.name}</span>
                    ))}
                  </div>

                  <div className="text-[10px] text-foreground/15 mt-2">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                {/* Status progress bar for active orders */}
                {isActive && (
                  <div className="px-4 pb-3 pt-1 border-t border-black/[0.03]">
                    <div className="flex items-center gap-1">
                      {statusFlow.map((s, i) => {
                        const done = i <= currentIdx;
                        return (
                          <div key={s} className="flex items-center gap-1 flex-1">
                            <div className={`w-full h-1.5 rounded-full transition-colors ${done ? statusStyle[s].bg : "bg-black/[0.04]"}`} />
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-foreground/30 mt-1.5 font-medium">{config.label}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
