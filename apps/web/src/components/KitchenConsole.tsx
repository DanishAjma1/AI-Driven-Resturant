"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { ChefHat, Clock, UtensilsCrossed, Truck } from "lucide-react";
import type { OrderDTO, OrderStatus } from "@ember-grain/shared";
import { OrderStatusPill } from "@/components/OrderStatusPill";

/** Kitchen actions available for a given order, keyed by resulting status.
 * DINE_IN orders skip PREPARED entirely — the cook serves them directly, so
 * there's no hand-off state that could get stranded with no console to
 * advance it. */
function actionsFor(order: OrderDTO): Array<{ next: OrderStatus; label: string; primary?: boolean }> {
  if (order.status === "RECEIVED") {
    return [{ next: "PREPARING", label: "Start preparing", primary: true }];
  }
  if (order.status === "PREPARING") {
    if (order.fulfillmentType === "DINE_IN") {
      return [{ next: "DELIVERED", label: "Mark served", primary: true }];
    }
    return [{ next: "PREPARED", label: "Mark prepared", primary: true }];
  }
  return [];
}

export function KitchenConsole({ initialOrders }: { initialOrders: OrderDTO[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/kitchen/orders");
      const json = await res.json();
      if (json.ok) setOrders(json.data as OrderDTO[]);
    } catch {
      // Polling failure is non-fatal; the next interval tick retries.
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 6000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function advance(order: OrderDTO, next: OrderStatus) {
    setBusyId(order.id);
    try {
      const res = await fetch(`/api/kitchen/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Couldn't update the order.");
      toast.success(`${order.displayId} moved to ${next.replace("_", " ").toLowerCase()}`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the order.");
    } finally {
      setBusyId(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-12 text-center text-[var(--color-text-dim)]">
        <ChefHat className="mx-auto mb-3 h-8 w-8 text-[var(--color-text-faint)]" />
        No orders waiting on the kitchen right now.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="font-[family-name:var(--font-mono)] text-lg">{order.displayId}</p>
            <OrderStatusPill status={order.status} />
          </div>
          <div className="mb-4 flex items-center gap-3 text-xs text-[var(--color-text-faint)]">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {new Date(order.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              {order.fulfillmentType === "DINE_IN" ? (
                <>
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                  Table {order.tableNumber}
                </>
              ) : (
                <>
                  <Truck className="h-3.5 w-3.5" />
                  Delivery
                </>
              )}
            </span>
          </div>
          <ul className="mb-4 space-y-1 text-sm text-[var(--color-text-dim)]">
            {order.items.map((line) => (
              <li key={line.id}>
                {line.quantity} × {line.name}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            {actionsFor(order).map((action) => (
              <button
                key={action.next}
                onClick={() => advance(order, action.next)}
                disabled={busyId === order.id}
                className="flex-1 rounded-full bg-[var(--color-ember)] py-2 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-ember-dim)] disabled:opacity-60"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
