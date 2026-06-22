"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";
import { ShoppingCart, Plus, Minus, Circle, Clock, X, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { Logo } from "@/components/logo";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isVeg: boolean;
  imageUrl: string | null;
}

interface TimeSlot {
  slotType: string;
  orderCutoffTime: string;
  deliveryTime: string;
}

interface Partner {
  id: string;
  name: string;
  address: string;
}

export default function MenuClient({
  partner,
  breakfastItems,
  dinnerItems,
  timeSlots,
}: {
  partner: Partner;
  breakfastItems: MenuItem[];
  dinnerItems: MenuItem[];
  timeSlots: TimeSlot[];
}) {
  const { items: cartItems, addItem, updateQuantity, totalItems, totalAmount, setPartnerId } = useCart();
  const [activeSlot, setActiveSlot] = useState<string>("BREAKFAST");
  const [showCart, setShowCart] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setPartnerId(partner.id);
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, [partner.id, setPartnerId]);

  const currentItems = activeSlot === "BREAKFAST" ? breakfastItems : dinnerItems;
  const currentSlot = timeSlots.find((s) => s.slotType === activeSlot);

  function isOrderingOpen(slot: TimeSlot | undefined): boolean {
    if (!slot) return false;
    const [h, m] = slot.orderCutoffTime.split(":").map(Number);
    const cutoff = new Date(now);
    cutoff.setHours(h, m, 0, 0);
    return now < cutoff;
  }

  const orderOpen = isOrderingOpen(currentSlot);

  function getCartQuantity(itemId: string): number {
    return cartItems.find((i) => i.id === itemId)?.quantity || 0;
  }

  return (
    <div className="min-h-screen relative bg-[#fafaf9]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-black/4 px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div>
              <h1 className="font-bold text-[14px] text-foreground tracking-tight">{partner.name}</h1>
              <p className="text-[11px] text-foreground/30">{partner.address}</p>
            </div>
          </div>
          {totalItems > 0 && (
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2.5 rounded-xl bg-foreground text-background"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center min-w-4.5">
                {totalItems}
              </span>
            </button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-32">
        {/* Slot tabs */}
        <div className="flex gap-1.5 p-1 bg-white rounded-xl border border-black/4 mb-5">
          {(["BREAKFAST", "DINNER"] as const).map((slot) => (
            <button
              key={slot}
              onClick={() => setActiveSlot(slot)}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-300 ${
                activeSlot === slot
                  ? "bg-foreground text-background"
                  : "text-foreground/30 hover:text-foreground/50"
              }`}
            >
              {slot === "BREAKFAST" ? "Breakfast" : "Dinner"}
            </button>
          ))}
        </div>

        {/* Order window status */}
        {currentSlot && (
          <div className={`p-3.5 rounded-xl mb-5 flex items-center gap-3 ${
            orderOpen
              ? "bg-emerald-50 border border-emerald-200/50"
              : "bg-red-50 border border-red-200/50"
          }`}>
            <Clock className={`w-4 h-4 ${orderOpen ? "text-emerald-600" : "text-red-500"}`} />
            <div>
              <div className={`text-[13px] font-semibold ${orderOpen ? "text-emerald-700" : "text-red-600"}`}>
                {orderOpen ? "Ordering Open" : "Ordering Closed"}
              </div>
              <div className="text-[11px] text-foreground/30">
                Cutoff: {currentSlot.orderCutoffTime} &middot; Delivery by {currentSlot.deliveryTime}
              </div>
            </div>
          </div>
        )}

        {/* Menu items */}
        {currentItems.length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed className="w-8 h-8 mx-auto text-foreground/10 mb-3" />
            <p className="text-foreground/25 text-[13px] font-medium">No items available</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentItems.map((item) => {
              const qty = getCartQuantity(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white border border-black/4 hover:border-black/8 transition-colors duration-300 cursor-pointer"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} width={56} height={56} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    ) : null}
                    <Circle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${item.isVeg ? "text-emerald-500" : "text-red-500"}`} fill="currentColor" />
                    <div className="min-w-0">
                      <div className="font-medium text-[13px] text-foreground/80">{item.name}</div>
                      {item.description && <p className="text-[11px] text-foreground/25 mt-0.5 line-clamp-1">{item.description}</p>}
                      <div className="text-[13px] font-bold mt-1 text-foreground">₹{item.price}</div>
                    </div>
                  </div>
                  <div className="ml-4" onClick={(e) => e.stopPropagation()}>
                    {qty === 0 ? (
                      <button
                        onClick={() => addItem({ id: item.id, name: item.name, price: item.price, isVeg: item.isVeg })}
                        disabled={!orderOpen}
                        className="px-5 py-2 rounded-lg bg-foreground text-background text-[12px] font-semibold hover:opacity-80 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        ADD
                      </button>
                    ) : (
                      <div className="flex items-center gap-2.5 bg-foreground rounded-lg px-2 py-1">
                        <button onClick={() => updateQuantity(item.id, qty - 1)} className="text-background p-0.5">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-background font-bold text-[12px] min-w-4 text-center">{qty}</span>
                        <button onClick={() => updateQuantity(item.id, qty + 1)} className="text-background p-0.5">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom cart bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-2xl border-t border-black/4 z-20">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setShowCart(true)}
              className="w-full flex items-center justify-between bg-foreground text-background px-5 py-3.5 rounded-2xl font-medium text-[14px] hover:opacity-90 transition-opacity"
            >
              <span>{totalItems} item{totalItems > 1 ? "s" : ""}</span>
              <span className="flex items-center gap-2">
                ₹{totalAmount.toFixed(0)}
                <ShoppingCart className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Cart drawer */}
      {showCart && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-end justify-center" onClick={() => setShowCart(false)}>
          <div className="bg-white w-full max-w-2xl rounded-t-3xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-black/4 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
              <h3 className="font-bold text-[15px] tracking-tight">Your Cart</h3>
              <button onClick={() => setShowCart(false)} className="p-2 rounded-lg hover:bg-black/3 text-foreground/30 hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Circle className={`w-3 h-3 ${item.isVeg ? "text-emerald-500" : "text-red-500"}`} fill="currentColor" />
                    <div>
                      <div className="text-[13px] font-medium text-foreground/70">{item.name}</div>
                      <div className="text-[11px] text-foreground/25">₹{item.price} each</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-black/3 rounded-lg px-2 py-1">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-0.5 text-foreground/40 hover:text-foreground">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-[12px] font-bold min-w-3.5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-0.5 text-foreground/40 hover:text-foreground">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[13px] font-bold w-14 text-right">₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                </div>
              ))}
              <hr className="border-black/4" />
              <div className="flex items-center justify-between text-[16px] font-bold">
                <span>Total</span>
                <span>₹{totalAmount.toFixed(0)}</span>
              </div>
              <Link
                href={`/menu/${partner.id}/checkout`}
                onClick={() => setShowCart(false)}
                className="block w-full text-center py-3.5 rounded-2xl bg-foreground text-background font-semibold text-[14px] hover:opacity-90 transition-opacity"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedItem(null)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {selectedItem.imageUrl ? (
              <div className="relative w-full h-52">
                <Image src={selectedItem.imageUrl} alt={selectedItem.name} fill sizes="(max-width: 640px) 100vw, 448px" className="object-cover rounded-t-3xl" />
              </div>
            ) : null}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Circle className={`w-4 h-4 mt-1 shrink-0 ${selectedItem.isVeg ? "text-emerald-500" : "text-red-500"}`} fill="currentColor" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-[17px] tracking-tight text-foreground">{selectedItem.name}</h3>
                    <div className="text-[15px] font-bold mt-0.5 text-foreground">₹{selectedItem.price}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-2 rounded-lg hover:bg-black/3 text-foreground/30 hover:text-foreground transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {selectedItem.description && (
                <p className="text-[13px] text-foreground/45 leading-relaxed mt-3">{selectedItem.description}</p>
              )}
              <div className="mt-5">
                {getCartQuantity(selectedItem.id) === 0 ? (
                  <button
                    onClick={() => addItem({ id: selectedItem.id, name: selectedItem.name, price: selectedItem.price, isVeg: selectedItem.isVeg })}
                    disabled={!orderOpen}
                    className="w-full py-3.5 rounded-2xl bg-foreground text-background font-semibold text-[14px] hover:opacity-80 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    {orderOpen ? "Add to Cart" : "Ordering Closed"}
                  </button>
                ) : (
                  <div className="flex items-center justify-between bg-foreground rounded-2xl px-4 py-2.5">
                    <button onClick={() => updateQuantity(selectedItem.id, getCartQuantity(selectedItem.id) - 1)} className="text-background p-1">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-background font-bold text-[15px]">{getCartQuantity(selectedItem.id)} in cart</span>
                    <button onClick={() => updateQuantity(selectedItem.id, getCartQuantity(selectedItem.id) + 1)} className="text-background p-1">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
