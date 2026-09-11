import { Type } from "@google/genai";
import { forecastResponseSchema, type ForecastResponse } from "@ember-grain/shared";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini/client";

export interface HistoricalOrderLine {
  itemId: string;
  name: string;
  /** ISO 8601 timestamp of the order the line item belonged to. */
  timestamp: string;
  quantity: number;
}

interface ItemAggregate {
  itemId: string;
  name: string;
  totalQty: number;
  byDay: Record<string, number>; // "Monday" -> qty
  byHourBucket: Record<string, number>; // "12:00-13:59" -> qty
  dailyTotals: number[]; // one entry per calendar day observed, for stdev
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function hourBucketLabel(hour: number): string {
  const start = Math.floor(hour / 2) * 2;
  const end = start + 2;
  const fmt = (h: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}:00 ${period}`;
  };
  return `${fmt(start)} - ${fmt(end)}`;
}

function aggregate(lines: HistoricalOrderLine[]): ItemAggregate[] {
  const byItem = new Map<string, ItemAggregate>();
  const dailyByItem = new Map<string, Map<string, number>>(); // itemId -> "YYYY-MM-DD" -> qty

  for (const line of lines) {
    const date = new Date(line.timestamp);
    const dayName = DAY_NAMES[date.getDay()]!;
    const bucket = hourBucketLabel(date.getHours());
    const dateKey = date.toISOString().slice(0, 10);

    let agg = byItem.get(line.itemId);
    if (!agg) {
      agg = {
        itemId: line.itemId,
        name: line.name,
        totalQty: 0,
        byDay: {},
        byHourBucket: {},
        dailyTotals: [],
      };
      byItem.set(line.itemId, agg);
    }
    agg.totalQty += line.quantity;
    agg.byDay[dayName] = (agg.byDay[dayName] ?? 0) + line.quantity;
    agg.byHourBucket[bucket] = (agg.byHourBucket[bucket] ?? 0) + line.quantity;

    let dailyMap = dailyByItem.get(line.itemId);
    if (!dailyMap) {
      dailyMap = new Map();
      dailyByItem.set(line.itemId, dailyMap);
    }
    dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + line.quantity);
  }

  for (const agg of byItem.values()) {
    agg.dailyTotals = Array.from(dailyByItem.get(agg.itemId)?.values() ?? []);
  }

  return Array.from(byItem.values());
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stddev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const variance = mean(nums.map((n) => (n - m) ** 2));
  return Math.sqrt(variance);
}

function topEntry(record: Record<string, number>): [string, number] {
  const entries = Object.entries(record);
  if (entries.length === 0) return ["Unknown", 0];
  return entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best));
}

function shiftHourLabel(bucketLabel: string, hoursEarlier: number): string {
  const [startLabel] = bucketLabel.split(" - ");
  const match = startLabel!.match(/(\d+):00\s(AM|PM)/);
  if (!match) return "11:00 AM";
  let hour = parseInt(match[1]!, 10) % 12;
  if (match[2] === "PM") hour += 12;
  hour = (hour - hoursEarlier + 24) % 24;
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${period}`;
}

/** Analytical fallback used when no GOOGLE_GENAI_API_KEY is configured, or the call fails. */
function localForecast(aggregates: ItemAggregate[]): ForecastResponse {
  const forecasts = aggregates
    .filter((a) => a.totalQty > 0)
    .map((a) => {
      const [topDay, topDayQty] = topEntry(a.byDay);
      const [topBucket] = topEntry(a.byHourBucket);
      const avgDaily = mean(a.dailyTotals);
      const sd = stddev(a.dailyTotals);
      const backupQty = Math.max(1, Math.ceil(avgDaily * 0.25 + sd));
      const confidence: "low" | "medium" | "high" =
        a.dailyTotals.length >= 14 ? "high" : a.dailyTotals.length >= 7 ? "medium" : "low";

      return {
        itemId: a.itemId,
        name: a.name,
        highDemandDay: topDayQty > 0 ? topDay : "No clear pattern yet",
        peakDemandWindow: topBucket,
        recommendedBackupQty: backupQty,
        prepActionTime: `Prep by ${shiftHourLabel(topBucket, 1)}`,
        confidence,
      };
    })
    .sort((a, b) => b.recommendedBackupQty - a.recommendedBackupQty);

  return {
    generatedAt: new Date().toISOString(),
    windowDays: 0,
    forecasts,
  };
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    generatedAt: { type: Type.STRING },
    windowDays: { type: Type.NUMBER },
    forecasts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          itemId: { type: Type.STRING },
          name: { type: Type.STRING },
          highDemandDay: { type: Type.STRING },
          peakDemandWindow: { type: Type.STRING },
          recommendedBackupQty: { type: Type.NUMBER },
          prepActionTime: { type: Type.STRING },
          confidence: { type: Type.STRING, enum: ["low", "medium", "high"] },
        },
        required: [
          "itemId",
          "name",
          "highDemandDay",
          "peakDemandWindow",
          "recommendedBackupQty",
          "prepActionTime",
          "confidence",
        ],
      },
    },
  },
  required: ["generatedAt", "windowDays", "forecasts"],
};

function buildPrompt(aggregates: ItemAggregate[], windowDays: number): string {
  const summary = aggregates.map((a) => ({
    itemId: a.itemId,
    name: a.name,
    totalQtySold: a.totalQty,
    quantityByDayOfWeek: a.byDay,
    quantityByTwoHourWindow: a.byHourBucket,
    averageDailyQty: Number(mean(a.dailyTotals).toFixed(2)),
    dailyQtyStdDev: Number(stddev(a.dailyTotals).toFixed(2)),
  }));

  return `
You are a restaurant operations analyst producing a prep and stocking briefing
for the kitchen manager, based on ${windowDays} days of historical order data.

PER-ITEM TIME-SERIES SUMMARY (units sold, bucketed by day-of-week and 2-hour
window across the whole window): ${JSON.stringify(summary)}

For EACH item, determine:
- "highDemandDay": the day(s) of the week where demand clearly spikes (e.g.
  "Friday & Saturday"). If no day stands out, say "No clear pattern yet".
- "peakDemandWindow": the 2-hour window most likely to cause a stockout,
  formatted like "12:00 PM - 2:00 PM".
- "recommendedBackupQty": an integer safety-stock quantity kitchen should
  have prepped as backup, sized to the item's daily average and volatility
  (higher stddev relative to the mean should raise the buffer).
- "prepActionTime": a concrete instruction like "Prep by 11:00 AM", timed
  ahead of the peak window so kitchen isn't caught short.
- "confidence": "low" | "medium" | "high" based on how much signal the data
  shows (more days observed and a clearer spike = higher confidence).

Set "generatedAt" to the current ISO 8601 timestamp and "windowDays" to ${windowDays}.
Respond with JSON only, matching the provided schema. Base every number and
day/time claim strictly on the summary given — do not invent items not listed.
`.trim();
}

export async function getDemandForecast(
  lines: HistoricalOrderLine[],
  windowDays: number,
): Promise<ForecastResponse> {
  const aggregates = aggregate(lines);
  const client = getGeminiClient();

  if (!client) {
    const fallback = localForecast(aggregates);
    return { ...fallback, windowDays };
  }

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildPrompt(aggregates, windowDays),
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const parsed: unknown = JSON.parse(response.text ?? "{}");
    const validated = forecastResponseSchema.safeParse(parsed);
    if (!validated.success) {
      console.error("[gemini_forecast_schema_mismatch]", validated.error.flatten());
      return { ...localForecast(aggregates), windowDays };
    }

    const knownIds = new Set(aggregates.map((a) => a.itemId));
    const safeForecasts = validated.data.forecasts.filter((f) => knownIds.has(f.itemId));
    return { ...validated.data, forecasts: safeForecasts };
  } catch (err) {
    console.error("[gemini_forecast_error]", err);
    return { ...localForecast(aggregates), windowDays };
  }
}
