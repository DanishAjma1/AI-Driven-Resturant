"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Truck, Clock } from "lucide-react";
import type { OrderDTO } from "@ember-grain/shared";
import { OrderStatusPill } from "@/components/OrderStatusPill";

export function DriverConsole({ initialOrders }: { initialOrders: OrderDTO[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/driver/orders");
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

  async function transition(order: OrderDTO, nextStatus: "OUT_FOR_DELIVERY" | "DELIVERED") {
    setBusyId(order.id);
    try {
      const res = await fetch(`/api/driver/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Couldn't update the order.");
      toast.success(
        nextStatus === "OUT_FOR_DELIVERY"
          ? `Claimed ${order.displayId}`
          : `${order.displayId} marked delivered`,
      );
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the order.");
    } finally {
      setBusyId(null);
    }
  }

  const prepared = orders.filter((o) => o.status === "PREPARED");
  const outForDelivery = orders.filter((o) => o.status === "OUT_FOR_DELIVERY");

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
          Ready to claim
        </h2>
        {prepared.length === 0 ? (
          <EmptyState label="No orders ready for pickup yet." />
        ) : (
          <div className="space-y-4">
            {prepared.map((order) => (
              <OrderCard key={order.id} order={order}>
                <button
                  onClick={() => transition(order, "OUT_FOR_DELIVERY")}
                  disabled={busyId === order.id}
                  className="w-full rounded-full bg-[var(--color-ember)] py-2 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-ember-dim)] disabled:opacity-60"
                >
                  Claim delivery
                </button>
              </OrderCard>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
          Out for delivery
        </h2>
        {outForDelivery.length === 0 ? (
          <EmptyState label="Nothing on the road right now." />
        ) : (
          <div className="space-y-4">
            {outForDelivery.map((order) => (
              <OrderCard key={order.id} order={order}>
                <button
                  onClick={() => transition(order, "DELIVERED")}
                  disabled={busyId === order.id}
                  className="w-full rounded-full bg-[var(--color-surface-2)] py-2 text-sm font-medium hover:bg-[var(--color-prepared)] hover:text-[var(--color-bg)] disabled:opacity-60"
                >
                  Mark delivered
                </button>
              </OrderCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function OrderCard({ order, children }: { order: OrderDTO; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-[family-name:var(--font-mono)] text-lg">{order.displayId}</p>
        <OrderStatusPill status={order.status} />
      </div>
      <div className="mb-4 flex items-center gap-1.5 text-xs text-[var(--color-text-faint)]">
        <Clock className="h-3.5 w-3.5" />
        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
      <ul className="mb-4 space-y-1 text-sm text-[var(--color-text-dim)]">
        {order.items.map((line) => (
          <li key={line.id}>
            {line.quantity} × {line.name}
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-dim)]">
      <Truck className="mx-auto mb-2 h-6 w-6 text-[var(--color-text-faint)]" />
      {label}
    </div>
  );
}
