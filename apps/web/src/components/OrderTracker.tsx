"use client";

import { useEffect, useState } from "react";
import type { OrderDTO } from "@ember-grain/shared";
import { OrderStatusPill, STATUS_LABEL } from "@/components/OrderStatusPill";

const TIMELINE: Array<OrderDTO["status"]> = [
  "RECEIVED",
  "PREPARING",
  "PREPARED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export function OrderTracker({ initialOrder }: { initialOrder: OrderDTO }) {
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    if (order.status === "DELIVERED" || order.status === "CANCELLED") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${initialOrder.id}`);
        const json = await res.json();
        if (json.ok) setOrder(json.data as OrderDTO);
      } catch {
        // Transient network hiccups shouldn't interrupt polling; next tick retries.
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [initialOrder.id, order.status]);

  const currentIndex = TIMELINE.indexOf(order.status);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-faint)]">Order</p>
          <p className="font-[family-name:var(--font-mono)] text-2xl">{order.displayId}</p>
        </div>
        <OrderStatusPill status={order.status} />
      </div>

      {order.status !== "CANCELLED" && (
        <ol className="mb-10 flex flex-wrap gap-3">
          {TIMELINE.map((step, i) => {
            const done = currentIndex >= i;
            return (
              <li
                key={step}
                className={`flex-1 min-w-[120px] rounded-xl border px-3 py-2.5 text-center text-xs font-medium ${
                  done
                    ? "border-[var(--color-ember)] bg-[var(--color-ember)]/10 text-[var(--color-ember)]"
                    : "border-[var(--color-border)] text-[var(--color-text-faint)]"
                }`}
              >
                {STATUS_LABEL[step]}
              </li>
            );
          })}
        </ol>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <p className="mb-3 text-sm text-[var(--color-text-faint)]">Items</p>
        <ul className="space-y-2">
          {order.items.map((line) => (
            <li key={line.id} className="flex justify-between text-sm">
              <span>
                {line.quantity} × {line.name}
              </span>
              <span className="font-[family-name:var(--font-mono)]">
                ${(line.priceAtTime * line.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-[var(--color-border)] pt-3 text-base font-medium">
          <span>Total</span>
          <span className="font-[family-name:var(--font-mono)]">
            ${order.totalAmount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
