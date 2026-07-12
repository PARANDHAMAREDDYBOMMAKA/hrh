"use client";

import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Circle, Loader2, UtensilsCrossed } from "lucide-react";

const GUEST_KEY = "hrh-guest";
const ORDERS_KEY = "hrh-orders";

function loadGuest(): { name: string; phone: string; room: string } {
  if (typeof window === "undefined") return { name: "", phone: "", room: "" };
  try {
    const saved = localStorage.getItem(GUEST_KEY);
    if (!saved) return { name: "", phone: "", room: "" };
    const p = JSON.parse(saved);
    return { name: p.name || "", phone: p.phone || "", room: p.room || "" };
  } catch {
    return { name: "", phone: "", room: "" };
  }
}

function rememberOrder(token: string, orderNumber: string) {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const list: { token: string; orderNumber: string; at: string }[] = raw ? JSON.parse(raw) : [];
    list.unshift({ token, orderNumber, at: new Date().toISOString() });
    localStorage.setItem(ORDERS_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {
    return;
  }
}

export default function CheckoutPage() {
  const { items, totalAmount, clearCart, partnerId } = useCart();
  const router = useRouter();
  const params = useParams();
  const [name, setName] = useState(() => loadGuest().name);
  const [phone, setPhone] = useState(() => loadGuest().phone);
  const [roomNumber, setRoomNumber] = useState(() => loadGuest().room);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const hour = now.getHours();
  const deliverySlot = hour < 12 ? "BREAKFAST" : "DINNER";

  async function handleOrder() {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!roomNumber.trim()) {
      toast.error("Please enter your room number");
      return;
    }

    setLoading(true);

    const orderPartnerId = partnerId || params.partnerId;

    try {
      localStorage.setItem(
        GUEST_KEY,
        JSON.stringify({ name: name.trim(), phone: phone.trim(), room: roomNumber.trim() })
      );
    } catch {
      void 0;
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerId: orderPartnerId,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        roomNumber: roomNumber.trim(),
        items: items.map((i) => ({ menuItemId: i.id, name: i.name, quantity: i.quantity, price: i.price, subtotal: i.price * i.quantity })),
        deliverySlot,
        deliveryNotes: deliveryNotes.trim() || null,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      clearCart();
      if (data.trackingToken) rememberOrder(data.trackingToken, data.orderNumber);
      toast.success("Order placed successfully!");
      router.push(data.trackingToken ? `/track/${data.trackingToken}` : `/menu/${orderPartnerId}`);
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to place order");
      setLoading(false);
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl bg-[#f5f5f4] border-0 text-foreground placeholder-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all duration-300 text-[13px]";

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#fafaf9]">
        <div className="text-center">
          <UtensilsCrossed className="w-8 h-8 mx-auto text-foreground/10 mb-3" />
          <p className="text-foreground/25 text-[13px] font-medium mb-4">Your cart is empty</p>
          <Link href={`/menu/${params.partnerId}`} className="text-[13px] text-foreground font-medium hover:opacity-70 transition-opacity">
            Go back to menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-black/4 px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href={`/menu/${params.partnerId}`} className="p-2 rounded-lg hover:bg-black/3 text-foreground/30 hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-bold text-[15px] tracking-tight">Checkout</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Order summary */}
        <div className="rounded-2xl bg-white border border-black/4 p-5">
          <h2 className="font-bold text-[14px] tracking-tight mb-4">Order Summary</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Circle className={`w-3 h-3 ${item.isVeg ? "text-emerald-500" : "text-red-500"}`} fill="currentColor" />
                  <span className="text-[13px] text-foreground/60">{item.quantity}x {item.name}</span>
                </div>
                <span className="text-[13px] font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
            <hr className="border-black/4" />
            <div className="flex items-center justify-between font-bold text-[16px]">
              <span>Total</span>
              <span>₹{totalAmount.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Your details */}
        <div className="rounded-2xl bg-white border border-black/4 p-5 space-y-4">
          <h2 className="font-bold text-[14px] tracking-tight">Your Details</h2>
          <div>
            <label className="block text-[12px] font-medium text-foreground/35 mb-1.5">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Rahul"
              className={inp}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-foreground/35 mb-1.5">Phone Number *</label>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., 98765 43210"
              className={inp}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-foreground/35 mb-1.5">Room Number *</label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g., 101"
              className={inp}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-foreground/35 mb-1.5">Delivery Notes</label>
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Any special instructions..."
              rows={3}
              className={`${inp} resize-none`}
            />
          </div>
          <div className="flex items-center gap-2 text-[12px] text-foreground/30">
            <span className="px-2 py-1 rounded-md bg-orange-50 text-orange-600 font-medium">{deliverySlot}</span>
            <span>Cash on Delivery</span>
          </div>
        </div>

        <button
          onClick={handleOrder}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-foreground text-background font-semibold text-[14px] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Placing order...
            </>
          ) : (
            `Place Order — ₹${totalAmount.toFixed(0)}`
          )}
        </button>
      </div>
    </div>
  );
}
