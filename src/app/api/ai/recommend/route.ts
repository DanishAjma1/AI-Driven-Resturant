import { NextResponse } from "next/server";
import { z } from "zod";
import { getAIMenuRecommendations } from "@/lib/gemini";
const schema = z.object({
  cartItems: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      price: z.number(),
    }),
  ),
  dietaryPreferences: z.array(z.string()).optional(),
  timeOfDay: z.string().optional(),
  query: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    return NextResponse.json(
      await getAIMenuRecommendations(schema.parse(await request.json())),
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid recommendation request" },
      { status: 400 },
    );
  }
}
