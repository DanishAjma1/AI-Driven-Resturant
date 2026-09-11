import { z } from "zod";

/* ---------------------------------------------------------------------- */
/*  /api/ai/recommend                                                     */
/* ---------------------------------------------------------------------- */

export const recommendRequestSchema = z.object({
  query: z.string().trim().max(280).optional(),
  cartItemIds: z.array(z.string()).max(50).optional(),
  dietaryPreferences: z.array(z.string()).max(10).optional(),
  /** Biases suggestions toward a specific category — used by the dish
   * detail page to ask for "beverage or dessert pairings" per spec. */
  preferredCategories: z.array(z.string()).max(5).optional(),
});
export type RecommendRequestInput = z.infer<typeof recommendRequestSchema>;

export const recommendationStatusSchema = z.enum([
  "found",
  "alternative_suggested",
  "not_available",
]);
export type RecommendationStatus = z.infer<typeof recommendationStatusSchema>;

export const recommendationItemSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  reason: z.string(),
  upsellType: z.enum(["pairing", "popular", "alternative"]),
});
export type RecommendationItem = z.infer<typeof recommendationItemSchema>;

export const recommendResponseSchema = z.object({
  status: recommendationStatusSchema,
  message: z.string().optional(),
  recommendations: z.array(recommendationItemSchema),
});
export type RecommendResponse = z.infer<typeof recommendResponseSchema>;

export const NOT_AVAILABLE_MESSAGE = "Sorry, we don't provide this dish yet.";

/* ---------------------------------------------------------------------- */
/*  /api/ai/forecast                                                      */
/* ---------------------------------------------------------------------- */

export const forecastRequestSchema = z.object({
  windowDays: z.number().int().min(7).max(30).default(15),
});
export type ForecastRequestInput = z.infer<typeof forecastRequestSchema>;

export const itemForecastSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  highDemandDay: z.string(),
  peakDemandWindow: z.string(),
  recommendedBackupQty: z.number().int().nonnegative(),
  prepActionTime: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
});
export type ItemForecast = z.infer<typeof itemForecastSchema>;

export const forecastResponseSchema = z.object({
  generatedAt: z.string(),
  windowDays: z.number(),
  forecasts: z.array(itemForecastSchema),
});
export type ForecastResponse = z.infer<typeof forecastResponseSchema>;
