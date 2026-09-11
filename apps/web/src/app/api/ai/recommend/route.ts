import { NextResponse } from "next/server";
import { recommendRequestSchema, apiSuccess } from "@ember-grain/shared";
import { withErrorHandling } from "@/lib/api-handler";
import { listMenuItems } from "@/lib/data/menu";
import { getEnhancedRecommendations } from "@/lib/gemini/recommend";

export const POST = withErrorHandling(async (request: Request) => {
  const body = recommendRequestSchema.parse(await request.json());
  const catalog = await listMenuItems({ onlyAvailable: true });

  const cartItems = (body.cartItemIds ?? [])
    .map((id) => catalog.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => ({ id: item.id, name: item.name }));

  const result = await getEnhancedRecommendations(
    {
      query: body.query,
      cartItems,
      dietaryPreferences: body.dietaryPreferences,
      preferredCategories: body.preferredCategories,
    },
    catalog,
  );

  return NextResponse.json(apiSuccess(result));
});
