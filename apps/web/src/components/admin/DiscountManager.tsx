"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { DiscountRuleDTO, MenuItemDTO } from "@ember-grain/shared";
import { DiscountForm } from "@/components/admin/DiscountForm";

export function DiscountManager({
  initialRules,
  categories,
  items,
}: {
  initialRules: DiscountRuleDTO[];
  categories: string[];
  items: MenuItemDTO[];
}) {
  const [rules, setRules] = useState(initialRules);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleActive(rule: DiscountRuleDTO) {
    setBusyId(rule.id);
    try {
      const res = await fetch(`/api/admin/discounts/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Couldn't update the discount.");
      setRules((prev) => prev.map((r) => (r.id === rule.id ? (json.data as DiscountRuleDTO) : r)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the discount.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(rule: DiscountRuleDTO) {
    if (!confirm(`Delete discount "${rule.code}"?`)) return;
    setBusyId(rule.id);
    try {
      const res = await fetch(`/api/admin/discounts/${rule.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Couldn't delete the discount.");
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
      toast.success("Discount deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the discount.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <DiscountForm
          categories={categories}
          items={items}
          onCreated={(rule) => setRules((prev) => [rule, ...prev])}
        />
      </div>

      {rules.length === 0 ? (
        <p className="text-[var(--color-text-dim)]">No discount rules yet.</p>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-[family-name:var(--font-mono)] font-medium">{rule.code}</p>
                <p className="text-xs text-[var(--color-text-faint)]">
                  {rule.discountType === "PERCENTAGE" ? `${rule.value}% off` : `$${rule.value.toFixed(2)} off`}
                  {" · "}
                  {rule.scope === "GLOBAL"
                    ? "all items"
                    : rule.scope === "CATEGORY"
                      ? rule.category
                      : `${rule.targetItemIds.length} item(s)`}
                  {rule.isScheduled && rule.startDate && rule.endDate && (
                    <>
                      {" · "}
                      {new Date(rule.startDate).toLocaleDateString()} –{" "}
                      {new Date(rule.endDate).toLocaleDateString()}
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => toggleActive(rule)}
                disabled={busyId === rule.id}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  rule.isActive
                    ? "bg-[var(--color-prepared)]/15 text-[var(--color-prepared)]"
                    : "bg-[var(--color-cancelled)]/15 text-[var(--color-cancelled)]"
                }`}
              >
                {rule.isActive ? "Active" : "Paused"}
              </button>
              <button
                onClick={() => handleDelete(rule)}
                disabled={busyId === rule.id}
                className="rounded-full p-2 text-[var(--color-text-faint)] hover:text-[var(--color-cancelled)]"
                aria-label={`Delete ${rule.code}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
