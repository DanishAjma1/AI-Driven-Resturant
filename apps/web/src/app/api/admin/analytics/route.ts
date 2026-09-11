import { NextResponse } from "next/server";
import { apiSuccess } from "@ember-grain/shared";
import { withErrorHandling, ValidationError } from "@/lib/api-handler";
import { requireRole } from "@/lib/require-user";
import { getDashboardKpis, getRevenueSeries, getTopItems, type Timeframe } from "@/lib/data/analytics";

const VALID_TIMEFRAMES: Timeframe[] = ["daily", "weekly", "monthly"];

export const GET = withErrorHandling(async (request: Request) => {
  await requireRole(["ADMIN"]);

  const { searchParams } = new URL(request.url);
  const timeframeParam = searchParams.get("timeframe") ?? "weekly";
  if (!VALID_TIMEFRAMES.includes(timeframeParam as Timeframe)) {
    throw new ValidationError("timeframe must be one of daily, weekly, monthly.");
  }
  const timeframe = timeframeParam as Timeframe;

  const [revenue, topItems, kpis] = await Promise.all([
    getRevenueSeries(timeframe),
    getTopItems(timeframe),
    getDashboardKpis(timeframe),
  ]);

  return NextResponse.json(apiSuccess({ timeframe, revenue, topItems, kpis }));
});
