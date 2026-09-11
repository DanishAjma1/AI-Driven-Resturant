"use client";

import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Plus, Trash2, Pencil, X } from "lucide-react";
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
  const [editingId, setEditingId] = useState<string | null>(focusItemId ?? null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function upsertLocal(item: MenuItemDTO) {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      return exists ? prev.map((i) => (i.id === item.id ? item : i)) : [item, ...prev];
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
      if (!json.ok) throw new Error(json.error?.message ?? "Couldn't update the item.");
      upsertLocal(json.data as MenuItemDTO);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the item.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item: MenuItemDTO) {
    if (!confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/admin/menu-items/${item.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Couldn't delete the item.");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Dish deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the item.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        {!creating && (
          <button
            onClick={() => {
              setCreating(true);
              setEditingId(null);
            }}
            className="flex items-center gap-2 rounded-full bg-[var(--color-ember)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-ember-dim)]"
          >
            <Plus className="h-4 w-4" />
            Add dish
          </button>
        )}
      </div>

      {creating && (
        <div className="mb-6">
          <MenuItemForm onSaved={upsertLocal} onCancel={() => setCreating(false)} />
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) =>
          editingId === item.id ? (
            <MenuItemForm
              key={item.id}
              item={item}
              onSaved={upsertLocal}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.name}</p>
                <p className="text-xs text-[var(--color-text-faint)]">
                  {item.category} · ${item.price.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => toggleAvailability(item)}
                disabled={busyId === item.id}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  item.isAvailable
                    ? "bg-[var(--color-prepared)]/15 text-[var(--color-prepared)]"
                    : "bg-[var(--color-cancelled)]/15 text-[var(--color-cancelled)]"
                }`}
              >
                {item.isAvailable ? "Available" : "Unavailable"}
              </button>
              <button
                onClick={() => {
                  setEditingId(item.id);
                  setCreating(false);
                }}
                className="rounded-full p-2 text-[var(--color-text-faint)] hover:text-[var(--color-ember)]"
                aria-label={`Edit ${item.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(item)}
                disabled={busyId === item.id}
                className="rounded-full p-2 text-[var(--color-text-faint)] hover:text-[var(--color-cancelled)]"
                aria-label={`Delete ${item.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ),
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
