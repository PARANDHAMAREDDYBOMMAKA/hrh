"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, ShoppingBag, X } from "lucide-react";

type Scope = "partner" | "admin";

interface NotifOrder {
  id: string;
  orderNumber: string;
  roomNumber: string;
  deliverySlot: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  customerName: string;
  customer: { name: string } | null;
}

const ENDPOINT: Record<Scope, string> = {
  partner: "/api/partner/orders",
  admin: "/api/orders",
};

const QUERY_KEY: Record<Scope, string[]> = {
  partner: ["partner-orders"],
  admin: ["orders"],
};

function playBeep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
    setTimeout(() => ctx.close().catch(() => {}), 700);
  } catch {
    return;
  }
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function OrderNotifications({ scope }: { scope: Scope }) {
  const readKey = `hrh-notif-read-${scope}`;
  const [open, setOpen] = useState(false);
  const [lastReadAt, setLastReadAt] = useState(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem(readKey) || 0);
  });
  const [highlightBefore, setHighlightBefore] = useState(lastReadAt);
  const seen = useRef<Set<string> | null>(null);

  const { data: orders = [] } = useQuery<NotifOrder[]>({
    queryKey: QUERY_KEY[scope],
    queryFn: async () => {
      const r = await fetch(ENDPOINT[scope]);
      if (!r.ok) return [];
      const d = await r.json();
      return Array.isArray(d) ? d : [];
    },
    refetchInterval: 15000,
  });

  const key = orders.map((o) => o.id).join(",");

  useEffect(() => {
    const ids = key ? key.split(",") : [];
    if (seen.current === null) {
      seen.current = new Set(ids);
      return;
    }
    const fresh = ids.filter((id) => !seen.current!.has(id));
    if (fresh.length === 0) return;
    fresh.forEach((id) => seen.current!.add(id));
    playBeep();
    toast.success(fresh.length === 1 ? "New order received" : `${fresh.length} new orders received`);
  }, [key]);

  const unread = useMemo(
    () => orders.filter((o) => new Date(o.createdAt).getTime() > lastReadAt).length,
    [orders, lastReadAt]
  );

  const markRead = useCallback(() => {
    const newest = orders.reduce((m, o) => Math.max(m, new Date(o.createdAt).getTime()), 0);
    const v = Math.max(newest, lastReadAt);
    setLastReadAt(v);
    try {
      localStorage.setItem(readKey, String(v));
    } catch {
      return;
    }
  }, [orders, lastReadAt, readKey]);

  function toggle() {
    if (!open) {
      setHighlightBefore(lastReadAt);
      markRead();
    }
    setOpen((p) => !p);
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative p-2 rounded-xl text-foreground/40 hover:text-foreground hover:bg-black/4 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-85 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-hidden rounded-2xl bg-white border border-black/6 shadow-[0_8px_40px_rgba(0,0,0,0.12)] z-50 flex flex-col">
            <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-[14px] tracking-tight">Notifications</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-foreground/30 hover:text-foreground hover:bg-black/4 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="py-14 text-center">
                <ShoppingBag className="w-7 h-7 mx-auto text-foreground/10 mb-2.5" />
                <p className="text-foreground/25 text-[12px] font-medium">No notifications yet</p>
              </div>
            ) : (
              <div className="overflow-y-auto">
                {orders.map((o) => {
                  const isNew = new Date(o.createdAt).getTime() > highlightBefore;
                  const name = o.customerName || o.customer?.name || "Guest";
                  return (
                    <div
                      key={o.id}
                      className={`px-4 py-3 border-b border-black/4 last:border-0 flex items-start gap-3 ${isNew ? "bg-orange-50/60" : ""}`}
                    >
                      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isNew ? "bg-orange-500" : "bg-transparent"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-foreground/80">New order</span>
                          <span className="font-mono text-[11px] text-foreground/35">#{o.orderNumber?.slice(-6)}</span>
                        </div>
                        <div className="text-[12px] text-foreground/45 mt-0.5 truncate">
                          {name} &middot; Room {o.roomNumber} &middot; ₹{o.totalAmount}
                        </div>
                      </div>
                      <span className="text-[11px] text-foreground/25 shrink-0 whitespace-nowrap">{timeAgo(o.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
