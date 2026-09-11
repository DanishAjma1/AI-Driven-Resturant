import { listKitchenQueue } from "@/lib/data/orders";
import { KitchenConsole } from "@/components/KitchenConsole";

export default async function KitchenPortalPage() {
  const orders = await listKitchenQueue();

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl">
        Kitchen console
      </h1>
      <p className="mb-8 text-[var(--color-text-dim)]">
        Move orders through the queue as they&apos;re prepped.
      </p>
      <KitchenConsole initialOrders={orders} />
    </div>
  );
}
