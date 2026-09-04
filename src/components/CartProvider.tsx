"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { CartItem, MenuItem } from "@/types";

type CartContextValue = {
  cart: CartItem[];
  add: (item: MenuItem) => void;
  change: (id: string, delta: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const value = useMemo(
    () => ({
      cart,
      add: (item: MenuItem) =>
        setCart((current) =>
          current.some((x) => x.id === item.id)
            ? current.map((x) =>
                x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x,
              )
            : [...current, { ...item, quantity: 1 }],
        ),
      change: (id: string, delta: number) =>
        setCart((current) =>
          current.flatMap((item) => {
            if (item.id !== id) return [item];
            return item.quantity + delta < 1
              ? []
              : [{ ...item, quantity: item.quantity + delta }];
          }),
        ),
      clear: () => setCart([]),
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      count: cart.reduce((sum, item) => sum + item.quantity, 0),
    }),
    [cart],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
