"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { MenuItemDTO, RecommendResponse } from "@ember-grain/shared";
import { useCart } from "@/components/CartProvider";

export function DishPairings({
  item,
  catalog,
}: {
  item: MenuItemDTO;
  catalog: MenuItemDTO[];
}) {
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    let cancelled = false;
    const preferredCategories =
      item.category === "Desserts" || item.category === "Drinks"
        ? ["Mains", "Starters"]
        : ["Desserts", "Drinks"];
    fetch("/api/ai/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemIds: [item.id], preferredCategories }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.ok) setResult(json.data as RecommendResponse);
      })
      .catch(() => {
        // Pairings are a nice-to-have on this page; fail silently rather
        // than blocking the dish detail from rendering.
      });
    return () => {
      cancelled = true;
    };
  }, [item.id, item.category]);

  if (!result || result.recommendations.length === 0) return null;

  return (
    <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-grain)]">
        <Sparkles className="h-4 w-4" />
        AI beverage &amp; dessert pairings
      </div>
      <ul className="space-y-2">
        {result.recommendations.map((rec) => {
          const pairItem = catalog.find((c) => c.id === rec.itemId);
          return (
            <li
              key={rec.itemId}
              className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-surface-2)] p-3"
            >
              <div>
                <p className="text-sm font-medium">{rec.name}</p>
                <p className="text-xs text-[var(--color-text-dim)]">{rec.reason}</p>
              </div>
              <button
                onClick={() => {
                  if (!pairItem) return;
                  addItem(pairItem);
                  toast.success(`${pairItem.name} added to your cart`);
                }}
                disabled={!pairItem}
                className="shrink-0 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs hover:border-[var(--color-ember)] disabled:opacity-50"
              >
                Add
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
