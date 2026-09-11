import { listDriverBoard } from "@/lib/data/orders";
import { DriverConsole } from "@/components/DriverConsole";

export default async function DriverPortalPage() {
  const orders = await listDriverBoard();

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl">
        Driver console
      </h1>
      <p className="mb-8 text-[var(--color-text-dim)]">
        Claim prepared orders and mark them delivered once dropped off.
      </p>
      <DriverConsole initialOrders={orders} />
    </div>
  );
}
