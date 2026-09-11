import { DollarSign, ChefHat, Timer, Receipt } from "lucide-react";
import type { DashboardKpis } from "@/lib/data/analytics";

export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  const cards = [
    {
      label: "Average order value",
      value: `$${kpis.averageOrderValue.toFixed(2)}`,
      icon: DollarSign,
    },
    {
      label: "Active in kitchen",
      value: kpis.activeKitchenOrders.toString(),
      icon: ChefHat,
    },
    {
      label: "Avg. delivery time",
      value: kpis.averageDeliveryMinutes > 0 ? `${kpis.averageDeliveryMinutes} min` : "—",
      icon: Timer,
    },
    {
      label: "Orders in window",
      value: kpis.totalOrders.toString(),
      icon: Receipt,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <div className="mb-3 flex items-center gap-2 text-[var(--color-text-faint)]">
            <Icon className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">{label}</span>
          </div>
          <p className="font-[family-name:var(--font-mono)] text-2xl">{value}</p>
        </div>
      ))}
    </div>
  );
}
