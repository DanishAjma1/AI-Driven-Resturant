import { listHistoricalOrderLines } from "@/lib/data/orders";
import { getDemandForecast } from "@/lib/gemini/forecast";
import { ForecastBoard } from "@/components/admin/ForecastBoard";

export default async function ForecastingPage() {
  const windowDays = 15;
  const lines = await listHistoricalOrderLines(windowDays);
  const forecast = await getDemandForecast(lines, windowDays);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl">
        Demand forecasting
      </h1>
      <p className="mb-8 max-w-2xl text-[var(--color-text-dim)]">
        Time-calibrated prep guidance from {windowDays} days of order history — when
        each item spikes, the stockout-risk window, and how much backup stock to
        prep before the shift starts.
      </p>
      <ForecastBoard initialForecast={forecast} />
    </div>
  );
}
