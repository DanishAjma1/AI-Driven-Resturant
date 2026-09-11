import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { listOrdersForCustomer } from "@/lib/data/orders";
import { TrackingLookupForm } from "./TrackingLookupForm";

export default async function TrackingIndexPage() {
  const user = await getCurrentUser();
  const recentOrders = user ? (await listOrdersForCustomer(user.id)).slice(0, 3) : [];

  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl">Track your order</h1>
      <p className="mb-8 text-[var(--color-text-dim)]">
        Enter the order code from your confirmation to see live status.
      </p>
      <TrackingLookupForm />

      {recentOrders.length > 0 && (
        <div className="mt-10">
          <p className="mb-3 text-sm text-[var(--color-text-faint)]">Or jump to a recent order</p>
          <ul className="space-y-2">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/tracking/${order.displayId}`}
                  className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm hover:border-[var(--color-ember)]"
                >
                  <span className="font-[family-name:var(--font-mono)]">{order.displayId}</span>
                  <span className="ml-3 text-[var(--color-text-faint)]">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
