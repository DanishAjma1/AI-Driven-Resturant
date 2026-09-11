"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import type { MenuItemDTO } from "@ember-grain/shared";
import { useCart, effectivePrice } from "@/components/CartProvider";

export function DishCustomizer({ item }: { item: MenuItemDTO }) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3 rounded-full border border-[var(--color-border)] px-3 py-2">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="text-[var(--color-text-dim)] hover:text-[var(--color-ember)]"
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-4 text-center font-[family-name:var(--font-mono)]">
          {quantity}
        </span>
        <button
          onClick={() => setQuantity((q) => q + 1)}
          className="text-[var(--color-text-dim)] hover:text-[var(--color-ember)]"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={() => {
          addItem(item, quantity);
          toast.success(`${quantity} × ${item.name} added to your cart`);
        }}
        disabled={!item.isAvailable}
        className="flex-1 rounded-full bg-[var(--color-ember)] py-2.5 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-ember-dim)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {item.isAvailable
          ? `Add to cart · $${(effectivePrice(item) * quantity).toFixed(2)}`
          : "Currently unavailable"}
      </button>
    </div>
  );
}
