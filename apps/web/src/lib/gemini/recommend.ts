import { Type } from "@google/genai";
import {
  NOT_AVAILABLE_MESSAGE,
  recommendResponseSchema,
  type MenuItemDTO,
  type RecommendResponse,
} from "@ember-grain/shared";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini/client";

export interface RecommendationInput {
  query?: string;
  cartItems?: Array<{ id: string; name: string }>;
  dietaryPreferences?: string[];
  /** Biases suggestions toward these categories (e.g. ["Desserts", "Drinks"]
   * when suggesting pairings from a Mains dish detail page). */
  preferredCategories?: string[];
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    status: {
      type: Type.STRING,
      enum: ["found", "alternative_suggested", "not_available"],
    },
    message: { type: Type.STRING },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          itemId: { type: Type.STRING },
          name: { type: Type.STRING },
          reason: { type: Type.STRING },
          upsellType: {
            type: Type.STRING,
            enum: ["pairing", "popular", "alternative"],
          },
        },
        required: ["itemId", "name", "reason", "upsellType"],
      },
    },
  },
  required: ["status", "recommendations"],
};

function buildPrompt(
  input: RecommendationInput,
  catalog: Array<Pick<MenuItemDTO, "id" | "name" | "category" | "description">>,
): string {
  return `
You are an AI Menu Guide for the restaurant "Ember & Grain".
AVAILABLE MENU CATALOG: ${JSON.stringify(catalog)}
USER CRAVING QUERY: "${input.query || "None"}"
CURRENT CART: ${JSON.stringify(input.cartItems || [])}
DIETARY PREFERENCES: ${JSON.stringify(input.dietaryPreferences || [])}
PREFERRED CATEGORIES FOR THIS SUGGESTION (bias toward these if given, e.g. a
beverage or dessert to pair with a main course; still respect rule 1 for
explicit queries): ${JSON.stringify(input.preferredCategories || [])}

RULES FOR DISH MATCHING:
1. If the user asks for a specific food category or dish (e.g. "rice", "sushi", "biryani")
   that is NOT present in the catalog above:
   - If a catalog item can serve as a logical substitute (similar craving profile,
     technique, or flavor family), suggest it with status "alternative_suggested"
     and explain the connection in "reason".
   - If no reasonable substitute exists in the catalog, set status to
     "not_available" and set "message" to exactly: "${NOT_AVAILABLE_MESSAGE}"
     Do not invent or hallucinate a dish that is not in the catalog.
2. If catalog matches exist for the query, set status to "found" and return up
   to 3 recommendations strictly from the catalog, respecting any dietary
   preferences given.
3. If no query was given, use the cart to suggest complementary pairings
   (status "found", upsellType "pairing" or "popular").
Respond with JSON only, matching the provided schema.
`.trim();
}

/** Deterministic fallback used when no GOOGLE_GENAI_API_KEY is configured, or the call fails. */
function localFallback(
  input: RecommendationInput,
  catalog: MenuItemDTO[],
): RecommendResponse {
  const query = (input.query || "").toLowerCase().trim();

  if (!query) {
    const preferredPool = input.preferredCategories?.length
      ? catalog.filter((i) => input.preferredCategories!.includes(i.category))
      : [];
    const popular = catalog.filter((i) => i.popular);
    const pool =
      preferredPool.length > 0
        ? preferredPool
        : popular.length > 0
          ? popular
          : catalog;
    return {
      status: "found",
      recommendations: pool.slice(0, 3).map((item) => ({
        itemId: item.id,
        name: item.name,
        reason: input.preferredCategories?.length
          ? `A ${item.category.toLowerCase()} that pairs nicely with your dish.`
          : `A guest favorite that pairs well with what's already in your cart.`,
        upsellType: "popular",
      })),
    };
  }

  const directMatches = catalog.filter(
    (item) =>
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.tags.some((tag) => tag.toLowerCase().includes(query)),
  );

  if (directMatches.length > 0) {
    return {
      status: "found",
      recommendations: directMatches.slice(0, 3).map((item) => ({
        itemId: item.id,
        name: item.name,
        reason: `Matches your craving for "${input.query}".`,
        upsellType: "popular",
      })),
    };
  }

  // Very small keyword→category map to approximate "relatable alternative" logic offline.
  const alternativeMap: Record<string, string[]> = {
    rice: ["Mains"],
    biryani: ["Mains"],
    sushi: ["Starters"],
    pasta: ["Mains"],
    pizza: ["Mains"],
    burger: ["Mains"],
    salad: ["Starters"],
    soup: ["Starters"],
    cake: ["Desserts"],
    coffee: ["Drinks"],
    cocktail: ["Drinks"],
  };
  const matchedCategories = Object.entries(alternativeMap).find(([key]) =>
    query.includes(key),
  )?.[1];

  if (matchedCategories) {
    const alternative = catalog.find((item) =>
      matchedCategories.includes(item.category),
    );
    if (alternative) {
      return {
        status: "alternative_suggested",
        message: `We don't have "${input.query}" on the menu, but you might enjoy this instead.`,
        recommendations: [
          {
            itemId: alternative.id,
            name: alternative.name,
            reason: `A similar craving profile to "${input.query}" — ${alternative.description}`,
            upsellType: "alternative",
          },
        ],
      };
    }
  }

  return {
    status: "not_available",
    message: NOT_AVAILABLE_MESSAGE,
    recommendations: [],
  };
}

export async function getEnhancedRecommendations(
  input: RecommendationInput,
  catalog: MenuItemDTO[],
): Promise<RecommendResponse> {
  const client = getGeminiClient();
  const trimmedCatalog = catalog.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description,
  }));

  if (!client) {
    return localFallback(input, catalog);
  }

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildPrompt(input, trimmedCatalog),
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const parsed: unknown = JSON.parse(response.text ?? "{}");
    const validated = recommendResponseSchema.safeParse(parsed);
    if (!validated.success) {
      console.error("[gemini_recommend_schema_mismatch]", validated.error.flatten());
      return localFallback(input, catalog);
    }

    // Guardrail: never let the model reference an item outside the real catalog.
    const catalogIds = new Set(catalog.map((item) => item.id));
    const safeRecommendations = validated.data.recommendations.filter((rec) =>
      catalogIds.has(rec.itemId),
    );

    return { ...validated.data, recommendations: safeRecommendations };
  } catch (err) {
    console.error("[gemini_recommend_error]", err);
    return localFallback(input, catalog);
  }
}
