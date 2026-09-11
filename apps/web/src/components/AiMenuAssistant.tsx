"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { RecommendResponse, MenuItemDTO } from "@ember-grain/shared";
import { useCart } from "@/components/CartProvider";

export function AiMenuAssistant({
  catalog,
  cartItemIds,
  placeholder = "Craving something? Try “spicy noodles” or “something vegan”…",
  variant = "hero",
}: {
  catalog: MenuItemDTO[];
  cartItemIds?: string[];
  placeholder?: string;
  variant?: "hero" | "compact";
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const { addItem } = useCart();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, cartItemIds }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Something went wrong.");
      setResult(json.data as RecommendResponse);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't reach the AI guide.");
    } finally {
      setLoading(false);
    }
  }

  function handleAdd(itemId: string) {
    const item = catalog.find((i) => i.id === itemId);
    if (!item) return;
    addItem(item);
    toast.success(`${item.name} added to your cart`);
  }

  const containerClass =
    variant === "hero"
      ? "rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      : "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4";

  return (
    <div className={containerClass}>
      <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-grain)]">
        <Sparkles className="h-4 w-4" />
        AI Menu Guide
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-ember)]"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-full bg-[var(--color-ember)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-ember-dim)] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
        </button>
      </form>

      {result && (
        <div className="mt-4">
          {result.status === "not_available" && (
            <p className="text-sm text-[var(--color-text-dim)]">{result.message}</p>
          )}
          {result.status === "alternative_suggested" && result.message && (
            <p className="mb-3 text-sm text-[var(--color-text-dim)]">{result.message}</p>
          )}
          {result.recommendations.length > 0 && (
            <ul className="space-y-2">
              {result.recommendations.map((rec) => (
                <li
                  key={rec.itemId}
                  className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-surface-2)] p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{rec.name}</p>
                    <p className="text-xs text-[var(--color-text-dim)]">{rec.reason}</p>
                  </div>
                  <button
                    onClick={() => handleAdd(rec.itemId)}
                    className="shrink-0 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs hover:border-[var(--color-ember)]"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
