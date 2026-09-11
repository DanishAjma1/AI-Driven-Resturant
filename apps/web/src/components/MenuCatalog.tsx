"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { MenuItemDTO, DietaryTag } from "@ember-grain/shared";
import { DishCard } from "@/components/DishCard";

const DIETARY_FILTERS: DietaryTag[] = ["Vegan", "Halal", "Gluten-Free"];

export function MenuCatalog({
  items,
  initialCategory,
  adminMode = false,
}: {
  items: MenuItemDTO[];
  initialCategory?: string;
  adminMode?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(initialCategory ?? "All");
  const [activeTags, setActiveTags] = useState<DietaryTag[]>([]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.category)))],
    [items],
  );

  const toggleTag = (tag: DietaryTag) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const filtered = items.filter((item) => {
    const matchesSearch =
      search.trim().length === 0 ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || item.category === category;
    const matchesTags = activeTags.every((tag) => item.tags.includes(tag));
    return matchesSearch && matchesCategory && matchesTags;
  });

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-faint)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the menu…"
            className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[var(--color-ember)]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {DIETARY_FILTERS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                activeTags.includes(tag)
                  ? "border-[var(--color-ember)] bg-[var(--color-ember)] text-[var(--color-bg)]"
                  : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-ember)]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              category === cat
                ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                : "text-[var(--color-text-faint)] hover:text-[var(--color-text-dim)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-[var(--color-text-dim)]">
          Nothing matches those filters yet — try clearing one.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <DishCard key={item.id} item={item} adminMode={adminMode} />
          ))}
        </div>
      )}
    </div>
  );
}
