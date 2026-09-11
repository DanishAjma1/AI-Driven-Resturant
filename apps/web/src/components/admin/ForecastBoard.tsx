"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Clock, PackagePlus, CalendarDays } from "lucide-react";
import type { ForecastResponse } from "@ember-grain/shared";

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "var(--color-prepared)",
  medium: "var(--color-preparing)",
  low: "var(--color-text-faint)",
};

export function ForecastBoard({ initialForecast }: { initialForecast: ForecastResponse }) {
  const [forecast, setForecast] = useState(initialForecast);
  const [windowDays, setWindowDays] = useState(initialForecast.windowDays || 15);
  const [isPending, startTransition] = useTransition();

  function reload(days: number) {
    setWindowDays(days);
    startTransition(async () => {
      const res = await fetch(`/api/ai/forecast?windowDays=${days}`);
      const json = await res.json();
      if (json.ok) setForecast(json.data as ForecastResponse);
    });
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        {[7, 15, 30].map((days) => (
          <button
            key={days}
            onClick={() => reload(days)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              windowDays === days
                ? "bg-[var(--color-ember)] text-[var(--color-bg)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            }`}
          >
            Last {days} days
          </button>
        ))}
      </div>

      {forecast.forecasts.length === 0 ? (
        <p className="text-[var(--color-text-dim)]">
          Not enough order history yet to forecast demand.
        </p>
      ) : (
        <div
          className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${isPending ? "opacity-60" : ""}`}
        >
          {forecast.forecasts.map((f) => (
            <div
              key={f.itemId}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium">{f.name}</h3>
                <span
                  className="rounded-full border px-2 py-0.5 text-xs"
                  style={{
                    borderColor: CONFIDENCE_COLOR[f.confidence],
                    color: CONFIDENCE_COLOR[f.confidence],
                  }}
                >
                  {f.confidence} confidence
                </span>
              </div>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-[var(--color-text-dim)]">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Spikes <strong className="text-[var(--color-text)]">{f.highDemandDay}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text-dim)]">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Stockout risk{" "}
                    <strong className="text-[var(--color-text)]">{f.peakDemandWindow}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text-dim)]">
                  <PackagePlus className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Backup qty{" "}
                    <strong className="text-[var(--color-text)]">
                      {f.recommendedBackupQty} units
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-ember)]">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <strong>{f.prepActionTime}</strong>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
