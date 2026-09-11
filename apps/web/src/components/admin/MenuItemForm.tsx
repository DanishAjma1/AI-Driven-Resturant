"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { MenuItemDTO, MenuItemInput } from "@ember-grain/shared";

const AVAILABLE_TAGS = ["Vegan", "Vegetarian", "Gluten-Free", "Halal", "Nut-Free", "Spicy"];
const CATEGORY_SUGGESTIONS = ["Starters", "Mains", "Desserts", "Drinks"];

function toFormState(item?: MenuItemDTO): MenuItemInput {
  return {
    name: item?.name ?? "",
    description: item?.description ?? "",
    price: item?.price ?? 0,
    category: item?.category ?? "Mains",
    imageUrl: item?.imageUrl ?? "",
    isAvailable: item?.isAvailable ?? true,
    tags: item?.tags ?? [],
    popular: item?.popular ?? false,
    calories: item?.calories ?? null,
    ingredients: item?.ingredients ?? [],
  };
}

export function MenuItemForm({
  item,
  onSaved,
  onCancel,
}: {
  item?: MenuItemDTO;
  onSaved: (item: MenuItemDTO) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<MenuItemInput>(toFormState(item));
  const [ingredientsText, setIngredientsText] = useState(item?.ingredients.join(", ") ?? "");
  const [saving, setSaving] = useState(false);

  function toggleTag(tag: string) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: MenuItemInput = {
        ...form,
        ingredients: ingredientsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const url = item ? `/api/admin/menu-items/${item.id}` : "/api/admin/menu-items";
      const res = await fetch(url, {
        method: item ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Couldn't save the item.");
      toast.success(item ? "Dish updated" : "Dish created");
      onSaved(json.data as MenuItemDTO);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Dish name"
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
        />
        <input
          required
          list="category-suggestions"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          placeholder="Category"
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
        />
        <datalist id="category-suggestions">
          {CATEGORY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <textarea
        required
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="Description"
        rows={2}
        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <input
          required
          type="number"
          step="0.01"
          min="0"
          value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
          placeholder="Price"
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
        />
        <input
          type="number"
          min="0"
          value={form.calories ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, calories: e.target.value ? Number(e.target.value) : null }))
          }
          placeholder="Calories (optional)"
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
        />
        <input
          required
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          placeholder="Image URL"
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
        />
      </div>

      <input
        value={ingredientsText}
        onChange={(e) => setIngredientsText(e.target.value)}
        placeholder="Ingredients, comma separated"
        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
      />

      <div className="flex flex-wrap gap-2">
        {AVAILABLE_TAGS.map((tag) => (
          <button
            type="button"
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`rounded-full border px-3 py-1 text-xs ${
              form.tags.includes(tag)
                ? "border-[var(--color-ember)] bg-[var(--color-ember)] text-[var(--color-bg)]"
                : "border-[var(--color-border)] text-[var(--color-text-dim)]"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
          />
          Available
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.popular}
            onChange={(e) => setForm((f) => ({ ...f, popular: e.target.checked }))}
          />
          Popular
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[var(--color-ember)] px-5 py-2 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-ember-dim)] disabled:opacity-60"
        >
          {item ? "Save changes" : "Create dish"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-[var(--color-surface-2)] px-5 py-2 text-sm hover:bg-[var(--color-bg)]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
