import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getDashboardKpis, getRevenueSeries, getTopItems } from "@/lib/data/analytics";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default async function AdminDashboardPage() {
  const timeframe = "weekly" as const;
  const [revenue, topItems, kpis] = await Promise.all([
    getRevenueSeries(timeframe),
    getTopItems(timeframe),
    getDashboardKpis(timeframe),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">
            Admin dashboard
          </h1>
          <p className="mt-1 text-[var(--color-text-dim)]">
            Live sales analytics and order management.
          </p>
        </div>
        <Link
          href="/admin/forecasting"
          className="flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm hover:border-[var(--color-ember)]"
        >
          <Sparkles className="h-4 w-4" />
          Demand forecasting
        </Link>
      </div>
      <AdminDashboard initialData={{ timeframe, revenue, topItems, kpis }} />
    </div>
  );
}
