import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { listOrdersForCustomer } from "@/lib/data/orders";
import { OrderStatusPill } from "@/components/OrderStatusPill";

export default async function MyOrdersPage() {
  const user = await getCurrentUser();
  const orders = user ? await listOrdersForCustomer(user.id) : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="mb-8 font-[family-name:var(--font-display)] text-3xl">My orders</h1>

      {orders.length === 0 ? (
        <p className="text-[var(--color-text-dim)]">
          You haven&apos;t placed an order yet.{" "}
          <Link href="/menu" className="text-[var(--color-ember)]">
            Browse the menu
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/tracking/${order.displayId}`}
                className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-ember)]"
              >
                <div>
                  <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-text-faint)]">
                    {order.displayId}
                  </p>
                  <p className="text-sm text-[var(--color-text-dim)]">
                    {new Date(order.createdAt).toLocaleString()} ·{" "}
                    {order.items.reduce((n, i) => n + i.quantity, 0)} items
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-[family-name:var(--font-mono)]">
                    ${order.totalAmount.toFixed(2)}
                  </span>
                  <OrderStatusPill status={order.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
