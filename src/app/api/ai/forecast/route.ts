import { NextResponse } from "next/server";
import { getDemandPrepForecast } from "@/lib/gemini";
import { historicalOrdersSeed } from "@/data/menu";
export async function GET() {
  return NextResponse.json(await getDemandPrepForecast(historicalOrdersSeed));
}
