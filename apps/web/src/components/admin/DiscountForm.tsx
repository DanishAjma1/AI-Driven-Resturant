"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { DiscountRuleDTO, DiscountScope, DiscountType, MenuItemDTO } from "@ember-grain/shared";

export function DiscountForm({
  categories,
  items,
  onCreated,
}: {
  categories: string[];
  items: MenuItemDTO[];
  onCreated: (rule: DiscountRuleDTO) => void;
}) {
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");
  const [value, setValue] = useState("");
  const [scope, setScope] = useState<DiscountScope>("GLOBAL");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [targetItemIds, setTargetItemIds] = useState<string[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  function toggleItem(id: string) {
    setTargetItemIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          value: Number(value),
          scope,
          category: scope === "CATEGORY" ? category : undefined,
          targetItemIds: scope === "SELECTIVE_ITEMS" ? targetItemIds : undefined,
          isScheduled,
          startDate: isScheduled && startDate ? new Date(startDate).toISOString() : undefined,
          endDate: isScheduled && endDate ? new Date(endDate).toISOString() : undefined,
          isActive,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Couldn't create the discount.");
      toast.success(`${code.toUpperCase()} created`);
      onCreated(json.data as DiscountRuleDTO);
      setCode("");
      setValue("");
      setTargetItemIds([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create the discount.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code, e.g. WEEKEND15"
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
        />
        <select
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value as DiscountType)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
        >
          <option value="PERCENTAGE">Percentage off</option>
          <option value="FIXED_AMOUNT">Fixed amount off</option>
        </select>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={discountType === "PERCENTAGE" ? "e.g. 15" : "e.g. 5.00"}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
        />
      </div>

      <div>
        <div className="mb-2 flex gap-2">
          {(["GLOBAL", "CATEGORY", "SELECTIVE_ITEMS"] as DiscountScope[]).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setScope(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                scope === s
                  ? "bg-[var(--color-ember)] text-[var(--color-bg)]"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-dim)]"
              }`}
            >
              {s === "GLOBAL" ? "All items" : s === "CATEGORY" ? "By category" : "Selected items"}
            </button>
          ))}
        </div>

        {scope === "CATEGORY" && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        {scope === "SELECTIVE_ITEMS" && (
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
            {items.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={targetItemIds.includes(item.id)}
                  onChange={() => toggleItem(item.id)}
                />
                {item.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isScheduled}
          onChange={(e) => setIsScheduled(e.target.checked)}
        />
        Schedule an active window (otherwise the toggle below controls it)
      </label>

      {isScheduled && (
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
          />
          <input
            required
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ember)]"
          />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active immediately
      </label>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-[var(--color-ember)] px-5 py-2 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-ember-dim)] disabled:opacity-60"
      >
        Create discount
      </button>
    </form>
  );
}
