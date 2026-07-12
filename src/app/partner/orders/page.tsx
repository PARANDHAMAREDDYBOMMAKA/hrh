"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";

interface OrderItem { name: string; quantity: number; price: number }

interface Order {
  id: string; orderNumber: string; roomNumber: string; deliverySlot: string;
  status: string; totalAmount: number; commissionAmount: number;
  items: OrderItem[]; deliveryNotes: string | null; createdAt: string;
  customerName: string; customerPhone: string;
  customer: { name: string; email: string; phone: string | null } | null;
}

const statusFlow = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

const statusStyle: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: "Pending", bg: "bg-amber-500", text: "text-amber-700 bg-amber-50" },
  CONFIRMED: { label: "Confirmed", bg: "bg-blue-500", text: "text-blue-700 bg-blue-50" },
  PREPARING: { label: "Preparing", bg: "bg-purple-500", text: "text-purple-700 bg-purple-50" },
  READY: { label: "Ready", bg: "bg-teal-500", text: "text-teal-700 bg-teal-50" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", bg: "bg-indigo-500", text: "text-indigo-700 bg-indigo-50" },
  DELIVERED: { label: "Delivered", bg: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50" },
  CANCELLED: { label: "Cancelled", bg: "bg-red-500", text: "text-red-700 bg-red-50" },
};

const filterTabs = [
  { key: "active", label: "Active" },
  { key: "all", label: "All" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default function PartnerOrdersPage() {
  const [filter, setFilter] = useState("active");

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["partner-orders"],
    queryFn: async () => {
      const r = await fetch("/api/partner/orders");
      if (!r.ok) return [];
      const d = await r.json();
      return Array.isArray(d) ? d : [];
    },
    refetchInterval: 15000,
  });

  const filtered = orders.filter((o) => {
    if (filter === "active") return !["DELIVERED", "CANCELLED"].includes(o.status);
    if (filter === "delivered") return o.status === "DELIVERED";
    if (filter === "cancelled") return o.status === "CANCELLED";
    return true;
  });

  const activeCount = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Orders</h2>
        <p className="text-foreground/30 text-[13px] mt-0.5">{orders.length} total &middot; {activeCount} active</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 p-1 bg-white rounded-xl border border-black/4 w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-300 ${
              filter === tab.key ? "bg-foreground text-background" : "text-foreground/30 hover:text-foreground/50"
            }`}
          >
            {tab.label}
            {tab.key === "active" && activeCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-orange-500 text-white text-[10px] font-bold">{activeCount}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white border border-black/4">
          <ShoppingBag className="w-8 h-8 mx-auto text-foreground/10 mb-3" />
          <p className="text-foreground/25 text-[13px] font-medium">No {filter !== "all" ? filter : ""} orders</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const config = statusStyle[order.status] || statusStyle.PENDING;
            const isActive = !["DELIVERED", "CANCELLED"].includes(order.status);
            const currentIdx = statusFlow.indexOf(order.status);

            return (
              <div key={order.id} className="rounded-2xl bg-white border border-black/4 hover:border-black/8 transition-colors duration-300 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[13px] font-bold text-foreground/60">#{order.orderNumber?.slice(-6)}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${config.text}`}>{config.label}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 font-medium">{order.deliverySlot}</span>
                      </div>
                      <div className="mt-2 text-[13px] text-foreground/40">
                        <span className="font-medium text-foreground/60">{order.customerName || order.customer?.name}</span>
                        {(order.customerPhone || order.customer?.phone) && <span> &middot; {order.customerPhone || order.customer?.phone}</span>}
                        {" "}&middot; Room {order.roomNumber}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(order.items as OrderItem[]).map((item, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-black/3 text-foreground/35 font-medium">{item.quantity}x {item.name}</span>
                        ))}
                      </div>
                      {order.deliveryNotes && <p className="mt-1.5 text-[11px] text-foreground/25 italic">Note: {order.deliveryNotes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[17px] font-bold tracking-tight">₹{order.totalAmount}</div>
                      <div className="text-[10px] text-foreground/20 mt-0.5">Comm: ₹{Math.abs(order.commissionAmount).toFixed(0)}</div>
                      <div className="text-[10px] text-foreground/15 mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                    </div>
                  </div>
                </div>

                {/* Status progress (view only) */}
                {isActive && (
                  <div className="px-5 pb-4 pt-1 border-t border-black/3">
                    <div className="flex items-center gap-1">
                      {statusFlow.map((s, i) => {
                        const done = i <= currentIdx;
                        const isCurrent = i === currentIdx;
                        return (
                          <div key={s} className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full transition-colors ${done ? statusStyle[s].bg : "bg-black/6"} ${isCurrent ? "ring-2 ring-offset-1 ring-black/10" : ""}`} />
                            {i < statusFlow.length - 1 && <div className={`w-4 h-px ${done && i < currentIdx ? "bg-black/15" : "bg-black/4"}`} />}
                          </div>
                        );
                      })}
                      <span className="ml-2 text-[10px] text-foreground/25 truncate">{config.label}</span>
                    </div>
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
