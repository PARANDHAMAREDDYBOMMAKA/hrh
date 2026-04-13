"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
}

interface CartContextType {
  items: CartItem[];
  partnerId: string | null;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setPartnerId: (id: string) => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [partnerId, setPartnerIdState] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("hrh-cart");
    if (saved) {
      const parsed = JSON.parse(saved);
      setItems(parsed.items || []);
      setPartnerIdState(parsed.partnerId || null);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hrh-cart", JSON.stringify({ items, partnerId }));
  }, [items, partnerId]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPartnerIdState(null);
  }, []);

  const setPartnerId = useCallback((id: string) => {
    setPartnerIdState((prev) => {
      if (prev && prev !== id) {
        setItems([]);
      }
      return id;
    });
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        partnerId,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setPartnerId,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
