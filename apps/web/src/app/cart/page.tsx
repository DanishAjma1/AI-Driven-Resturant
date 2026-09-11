"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { DishPrice } from "@/components/DishPrice";

export default function CartPage() {
  const { lines, setQuantity, removeItem, subtotal } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Your cart is empty
        </h1>
        <p className="mt-3 text-[var(--color-text-dim)]">
          Add something from the menu to get started.
        </p>
        <Link
          href="/menu"
          className="mt-6 inline-block rounded-full bg-[var(--color-ember)] px-5 py-2.5 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-ember-dim)]"
        >
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="mb-8 font-[family-name:var(--font-display)] text-3xl">Your cart</h1>
      <ul className="space-y-4">
        {lines.map(({ item, quantity }) => (
          <li
            key={item.id}
            className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
              <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <DishPrice item={item} className="text-sm" />
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] px-2 py-1">
              <button
                onClick={() => setQuantity(item.id, quantity - 1)}
                className="text-[var(--color-text-dim)] hover:text-[var(--color-ember)]"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-4 text-center text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(item.id, quantity + 1)}
                className="text-[var(--color-text-dim)] hover:text-[var(--color-ember)]"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="text-[var(--color-text-faint)] hover:text-[var(--color-cancelled)]"
              aria-label={`Remove ${item.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border)] pt-6">
        <span className="text-[var(--color-text-dim)]">Subtotal</span>
        <span className="font-[family-name:var(--font-mono)] text-xl">
          ${subtotal.toFixed(2)}
        </span>
      </div>

      <Link
        href="/checkout"
        className="mt-6 block rounded-full bg-[var(--color-ember)] py-3 text-center text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-ember-dim)]"
      >
        Proceed to checkout
      </Link>
    </div>
  );
}
