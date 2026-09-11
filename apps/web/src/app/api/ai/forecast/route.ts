import { NextResponse } from "next/server";
import { apiSuccess } from "@ember-grain/shared";
import { withErrorHandling, ValidationError } from "@/lib/api-handler";
import { requireRole } from "@/lib/require-user";
import { listHistoricalOrderLines } from "@/lib/data/orders";
import { getDemandForecast } from "@/lib/gemini/forecast";

export const GET = withErrorHandling(async (request: Request) => {
  await requireRole(["ADMIN"]);

  const { searchParams } = new URL(request.url);
  const windowDaysParam = searchParams.get("windowDays") ?? "15";
  const windowDays = Number(windowDaysParam);
  if (!Number.isInteger(windowDays) || windowDays < 7 || windowDays > 30) {
    throw new ValidationError("windowDays must be an integer between 7 and 30.");
  }

  const lines = await listHistoricalOrderLines(windowDays);
  const forecast = await getDemandForecast(lines, windowDays);

  return NextResponse.json(apiSuccess(forecast));
});
