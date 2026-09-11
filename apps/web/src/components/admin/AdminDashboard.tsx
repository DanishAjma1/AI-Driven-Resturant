"use client";

import { useState, useTransition } from "react";
import type { Timeframe, RevenuePoint, TopItemPoint, DashboardKpis } from "@/lib/data/analytics";
import { KpiCards } from "@/components/admin/KpiCards";
import { RevenueVolumeChart } from "@/components/charts/RevenueVolumeChart";
import { TopItemsChart } from "@/components/charts/TopItemsChart";

export interface DashboardData {
  timeframe: Timeframe;
  revenue: RevenuePoint[];
  topItems: TopItemPoint[];
  kpis: DashboardKpis;
}

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function AdminDashboard({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  function selectTimeframe(timeframe: Timeframe) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/analytics?timeframe=${timeframe}`);
      const json = await res.json();
      if (json.ok) setData(json.data as DashboardData);
    });
  }

  return (
    <div className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <div className="mb-8 flex items-center gap-2">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => selectTimeframe(tf.value)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              data.timeframe === tf.value
                ? "bg-[var(--color-ember)] text-[var(--color-bg)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <KpiCards kpis={data.kpis} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-4 text-sm font-medium text-[var(--color-text-dim)]">
            Revenue &amp; order volume
          </h2>
          <RevenueVolumeChart data={data.revenue} />
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-4 text-sm font-medium text-[var(--color-text-dim)]">
            Top performing menu items
          </h2>
          <TopItemsChart data={data.topItems} />
        </div>
      </div>
    </div>
  );
}
