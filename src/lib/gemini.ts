import { menuItems } from "@/data/menu";
import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { listOrders } from "./orders";

export interface CartItemInput {
  id: string;
  name: string;
  category: string;
  price: number;
}
export interface AIRecommendationRequest {
  cartItems: CartItemInput[];
  dietaryPreferences?: string[];
  timeOfDay?: string;
  query?: string;
}
const fallback = {
  recommendations: [
    {
      itemId: "chocolate-torte",
      name: "Obsidian Chocolate Torte",
      reason: "A smoky, rich finish rounds out your fire-kissed order.",
      upsellType: "dessert",
    },
    {
      itemId: "elote",
      name: "Smoked Corn Elote",
      reason: "Its bright charred lime cuts through savory mains.",
      upsellType: "pairing",
    },
    {
      itemId: "old-fashioned",
      name: "Flame Old Fashioned",
      reason: "Oak-aged bitters mirror the menu's signature smoke.",
      upsellType: "populars",
    },
  ],
};
async function ask(
  prompt: string,
  fallbackValue: unknown,
  responseJsonSchema: unknown,
) {
  try {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      console.warn(
        "Missing GOOGLE_GENAI_API_KEY; returning deterministic AI fallback.",
      );
      return fallbackValue;
    }
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai?.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseJsonSchema: responseJsonSchema as never,
      },
    });
    return JSON.parse(response?.text || JSON.stringify(fallbackValue));
  } catch (error) {
    console.log("Error calling Gemini API, returning fallback value.", error);
    return fallbackValue;
  }
}

const menuCatalog = menuItems.map((item) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  dietaryTags: item.tags,
}));

export async function getAIMenuRecommendations(input: AIRecommendationRequest) {
  return ask(
    `You are an expert restaurant menu assistant. Return exactly 3 suitable menu items as JSON with recommendations [{itemId,name,reason,upsellType}].
    
    Current Cart: ${JSON.stringify(input.cartItems)}
    User Craving / Query: ${input.query || "complement this cart"}
    Dietary Restrictions: ${JSON.stringify(input.dietaryPreferences || [])}
    Time of Day: ${input.timeOfDay || "Lunch"}

    AVAILABLE RESTAURANT MENU CATALOG:
    ${JSON.stringify(menuCatalog)}

    CRITICAL RULES:
    1. You MUST ONLY pick items that exist in the AVAILABLE RESTAURANT MENU CATALOG list above.
    2. The 'itemId' and 'name' in your output MUST match the 'id' and 'name' from the provided catalog exactly.
    3. Do NOT recommend items that are already inside the user's Current Cart.`,
    fallback,
    {
      type: Type.OBJECT,
      properties: {
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
                enum: ["pairing", "popular", "dessert"],
              },
            },
            required: ["itemId", "name", "reason", "upsellType"],
          },
        },
      },
      required: ["recommendations"],
    },
  );
}

// For the demand forecast, we will provide a fallback in case the AI fails to generate a response. This ensures that the application can still function and provide some level of guidance to the user.
const foreCastFallback = {
  forecast: [
    {
      itemName: "Smoked Short Rib",
      recommendedPrepQty: 18,
      riskLevel: "high",
      reasoning: "Most frequent Friday dinner main.",
    },
    {
      itemName: "Obsidian Chocolate Torte",
      recommendedPrepQty: 12,
      riskLevel: "medium",
      reasoning: "Dessert appears in the busiest evening windows.",
    },
    {
      itemName: "Ember Mushroom Risotto",
      recommendedPrepQty: 10,
      riskLevel: "medium",
      reasoning: "Reliable vegetarian demand across lunch and dinner.",
    },
  ],
};

const historicalOrders = listOrders().map((orderData) => {
  return orderData.createdAt <
    new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    ? null
    : {
        id: orderData.id,
        customer: orderData.customer,
        items: orderData.items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
        })),
        total: orderData.total,
        status: orderData.status,
        createdAt: orderData.createdAt,
      };
});

// The getDemandPrepForecast function takes historical order data as input and uses the ask function to generate a forecast for the next shift. It returns a JSON object containing the forecasted items, their recommended preparation quantities, risk levels, and reasoning behind the recommendations.
export async function getDemandPrepForecast(seed: Record<string, unknown>[]) {
  return ask(
    `You are a kitchen prep analyst for a restaurant. Analyze historical restaurant orders from the past 15 days and generate a prep forecast for the upcoming shift.

    ALLOWED MENU ITEMS:
    ${JSON.stringify(menuItems)}

    HISTORICAL ORDER DATA (PAST 15 DAYS):
    ${JSON.stringify(historicalOrders)}

    CRITICAL CONSTRAINTS:
    1. Every 'itemName' in the 'forecast' array MUST strictly match an item name or gradient from the ALLOWED MENU ITEMS list above.
    2. Do NOT invent off-menu items, unlisted ingredients, or items not present in the ALLOWED MENU ITEMS list.
    3. Return JSON containing {forecast:[{itemName,recommendedPrepQty,riskLevel,reasoning}],peakHourSummary}. Use riskLevel high, medium, or low. Use reasoning to justify the recommended prep quantity based on historical order patterns and trends. Provide a peakHourSummary that summarizes the busiest hours and expected demand during those times.`,
    foreCastFallback,
    {
      type: Type.OBJECT,
      properties: {
        forecast: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemName: { type: Type.STRING },
              recommendedPrepQty: { type: Type.NUMBER },
              riskLevel: {
                type: Type.STRING,
                enum: ["high", "medium", "low"],
              },
              reasoning: { type: Type.STRING },
            },
            required: [
              "itemName",
              "recommendedPrepQty",
              "riskLevel",
              "reasoning",
            ],
          },
        },
        peakHourSummary: { type: Type.STRING },
      },
      required: ["forecast", "peakHourSummary"],
    },
  );
}
