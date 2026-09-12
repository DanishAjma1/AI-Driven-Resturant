"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Plus, Trash2, Pencil, X, Search, Filter, ChefHat } from "lucide-react";
import type { MenuItemDTO } from "@ember-grain/shared";
import { MenuItemForm } from "@/components/admin/MenuItemForm";

export function MenuManager({
  initialItems,
  focusItemId,
}: {
  initialItems: MenuItemDTO[];
  focusItemId?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(
    focusItemId ?? null,
  );
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = useMemo(() => {
    const unique = [
      ...new Set(items.map((item) => item.category).filter(Boolean)),
    ];
    return ["All", ...unique.sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.price.toString().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [items, search, selectedCategory]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce<Record<string, MenuItemDTO[]>>((acc, item) => {
      const key = item.category || "Uncategorized";
      acc[key] = acc[key] ? [...acc[key], item] : [item];
      return acc;
    }, {});
  }, [filteredItems]);

  function upsertLocal(item: MenuItemDTO) {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      return exists
        ? prev.map((i) => (i.id === item.id ? item : i))
        : [item, ...prev];
    });
    setEditingId(null);
    setCreating(false);
  }

  async function toggleAvailability(item: MenuItemDTO) {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/admin/menu-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      const json = await res.json();
      if (!json.ok)
        throw new Error(json.error?.message ?? "Couldn't update the item.");
      upsertLocal(json.data as MenuItemDTO);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't update the item.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item: MenuItemDTO) {
    if (!confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/admin/menu-items/${item.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.ok)
        throw new Error(json.error?.message ?? "Couldn't delete the item.");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Dish deleted");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't delete the item.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-faint)]">
              Menu catalog
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
              Dish management
            </h2>
          </div>

          {!creating && (
            <button
              onClick={() => {
                setCreating(true);
                setEditingId(null);
              }}
              className="flex items-center justify-center gap-2 rounded-full bg-[var(--color-ember)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] transition hover:bg-[var(--color-ember-dim)]"
            >
              <Plus className="h-4 w-4" />
              Add dish
            </button>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-faint)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes or categories"
              className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-ember)]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--color-text-faint)]">
            <Filter className="h-4 w-4" />
            <span>{filteredItems.length} item(s)</span>
          </div>
        </div>
      </div>

      {creating && (
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <MenuItemForm
            onSaved={upsertLocal}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                selectedCategory === category
                  ? "bg-[var(--color-ember)] text-[var(--color-bg)]"
                  : "border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-faint)] hover:border-[var(--color-ember)] hover:text-[var(--color-text)]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {Object.keys(groupedItems).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-12 text-center">
            <ChefHat className="h-8 w-8 text-[var(--color-text-faint)]" />
            <p className="mt-3 text-base font-medium text-[var(--color-text)]">
              No menu items match your filters.
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-faint)]">
              Try adjusting your search or add a new dish to the menu.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <section key={category} className="space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-2">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
                    {category}
                  </h3>
                  <span className="rounded-full bg-[var(--color-bg)] px-2 py-1 text-[10px] font-medium text-[var(--color-text-faint)]">
                    {categoryItems.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {categoryItems.map((item) =>
                    editingId === item.id ? (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
                      >
                        <MenuItemForm
                          item={item}
                          onSaved={upsertLocal}
                          onCancel={() => setEditingId(null)}
                        />
                      </div>
                    ) : (
                      <div
                        key={item.id}
                        className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 md:flex-row md:items-center"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="truncate text-base font-semibold text-[var(--color-text)]">
                                {item.name}
                              </p>
                              <p className="text-xs text-[var(--color-text-faint)]">
                                {item.category}
                              </p>
                            </div>
                            <span
                              className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-medium ${
                                item.popular
                                  ? "bg-yellow-500/15 text-yellow-500"
                                  : "bg-blue-500/15 text-blue-500"
                              }`}
                            >
                              {item.popular ? "Popular" : "Ordinary"}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-text-faint)]">
                            <span>${item.price.toFixed(2)}</span>
                            <span>•</span>
                            <span>
                              {item.isAvailable
                                ? "Ready to serve"
                                : "Currently hidden"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:ml-auto">
                          <button
                            onClick={() => toggleAvailability(item)}
                            disabled={busyId === item.id}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                              item.isAvailable
                                ? "bg-[var(--color-prepared)]/10 text-[var(--color-prepared)] hover:bg-[var(--color-prepared)]/15"
                                : "bg-[var(--color-cancelled)]/10 text-[var(--color-cancelled)] hover:bg-[var(--color-cancelled)]/15"
                            }`}
                          >
                            {busyId === item.id
                              ? "Updating..."
                              : item.isAvailable
                                ? "Available"
                                : "Unavailable"}
                          </button>

                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setCreating(false);
                            }}
                            className="rounded-full p-2 text-[var(--color-text-faint)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-ember)]"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(item)}
                            disabled={busyId === item.id}
                            className="rounded-full p-2 text-[var(--color-text-faint)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-cancelled)]"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {editingId && !items.some((i) => i.id === editingId) && (
        <button
          onClick={() => setEditingId(null)}
          className="mt-3 flex items-center gap-1 text-xs text-[var(--color-text-faint)]"
        >
          <X className="h-3 w-3" /> Clear selection
        </button>
      )}
    </div>
  );
}
