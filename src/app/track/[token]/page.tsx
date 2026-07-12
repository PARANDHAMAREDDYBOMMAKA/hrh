"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Circle, Loader2, MapPin, Phone, UtensilsCrossed } from "lucide-react";

interface OrderItem { name: string; quantity: number; price: number }

interface TrackedOrder {
  id: string;
  orderNumber: string;
  status: string;
  roomNumber: string;
  deliverySlot: string;
  deliveryNotes: string | null;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  partner: { name: string; address: string; phone: string | null };
}

const statusFlow = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

const statusMeta: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: "Order placed", bg: "bg-amber-500", text: "text-amber-700 bg-amber-50" },
  CONFIRMED: { label: "Confirmed", bg: "bg-blue-500", text: "text-blue-700 bg-blue-50" },
  PREPARING: { label: "Preparing your food", bg: "bg-purple-500", text: "text-purple-700 bg-purple-50" },
  READY: { label: "Ready", bg: "bg-teal-500", text: "text-teal-700 bg-teal-50" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", bg: "bg-indigo-500", text: "text-indigo-700 bg-indigo-50" },
  DELIVERED: { label: "Delivered", bg: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50" },
  CANCELLED: { label: "Cancelled", bg: "bg-red-500", text: "text-red-700 bg-red-50" },
};

export default function TrackPage() {
  const params = useParams();
  const token = params.token as string;

  const { data: order, isLoading, isError } = useQuery<TrackedOrder>({
    queryKey: ["track", token],
    queryFn: async () => {
      const r = await fetch(`/api/track/${token}`);
      if (!r.ok) throw new Error("not found");
      return r.json();
    },
    refetchInterval: 10000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <Loader2 className="w-5 h-5 animate-spin text-foreground/30" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#fafaf9]">
        <div className="text-center">
          <UtensilsCrossed className="w-8 h-8 mx-auto text-foreground/10 mb-3" />
          <p className="text-foreground/25 text-[13px] font-medium">Order not found</p>
        </div>
      </div>
    );
  }

  const meta = statusMeta[order.status] || statusMeta.PENDING;
  const isCancelled = order.status === "CANCELLED";
  const currentIdx = statusFlow.indexOf(order.status);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-black/4 px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-[15px] tracking-tight">Order Tracking</h1>
          <span className="font-mono text-[12px] font-bold text-foreground/40">#{order.orderNumber?.slice(-6)}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Status */}
        <div className="rounded-2xl bg-white border border-black/4 p-5">
          <div className="flex items-center justify-between mb-5">
            <span className={`text-[12px] px-2.5 py-1 rounded-md font-semibold ${meta.text}`}>{meta.label}</span>
            <span className="text-[11px] text-foreground/25">
              {new Date(order.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
            </span>
          </div>

          {isCancelled ? (
            <p className="text-[13px] text-red-500 font-medium">This order was cancelled.</p>
          ) : (
            <div className="flex items-center gap-1">
              {statusFlow.map((s, i) => {
                const done = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={s} className="flex items-center gap-1 flex-1 last:flex-none">
                    <div className={`w-3 h-3 rounded-full shrink-0 transition-colors ${done ? statusMeta[s].bg : "bg-black/6"} ${isCurrent ? "ring-2 ring-offset-1 ring-black/10" : ""}`} />
                    {i < statusFlow.length - 1 && <div className={`h-px flex-1 ${i < currentIdx ? "bg-black/15" : "bg-black/4"}`} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Partner */}
        <div className="rounded-2xl bg-white border border-black/4 p-5 space-y-2.5">
          <h2 className="font-bold text-[14px] tracking-tight">{order.partner.name}</h2>
          <div className="flex items-center gap-2 text-[12px] text-foreground/40">
            <MapPin className="w-3.5 h-3.5 shrink-0" /> {order.partner.address}
          </div>
          {order.partner.phone && (
            <a href={`tel:${order.partner.phone}`} className="flex items-center gap-2 text-[12px] text-foreground/40 hover:text-foreground transition-colors">
              <Phone className="w-3.5 h-3.5 shrink-0" /> {order.partner.phone}
            </a>
          )}
          <div className="text-[12px] text-foreground/40 pt-1">
            <span className="px-2 py-1 rounded-md bg-orange-50 text-orange-600 font-medium mr-2">{order.deliverySlot}</span>
            Room {order.roomNumber}
          </div>
        </div>

        {/* Items */}
        <div className="rounded-2xl bg-white border border-black/4 p-5">
          <h2 className="font-bold text-[14px] tracking-tight mb-4">Your Order</h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[13px] text-foreground/60">{item.quantity}x {item.name}</span>
                <span className="text-[13px] font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
            <hr className="border-black/4" />
            <div className="flex items-center justify-between font-bold text-[16px]">
              <span>Total</span>
              <span>₹{order.totalAmount.toFixed(0)}</span>
            </div>
          </div>
          {order.deliveryNotes && <p className="mt-3 text-[11px] text-foreground/25 italic">Note: {order.deliveryNotes}</p>}
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-foreground/25">
          <Circle className="w-2 h-2 animate-pulse text-emerald-500" fill="currentColor" />
          Live &middot; updates automatically
        </div>
      </div>
    </div>
  );
}
