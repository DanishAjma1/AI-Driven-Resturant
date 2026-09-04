# AI Integration

## Overview

Ember & Grain integrates Google Gemini to provide two server-side AI capabilities:

1. Menu recommendations for customers based on a free-text craving and/or the current cart.
2. A preparation forecast for staff based on recent order history.

The integration is implemented in [`src/lib/gemini.ts`](../src/lib/gemini.ts) and is exposed through Next.js API route handlers. Gemini is an assistive feature; it does not create orders, modify menu data, or advance order statuses.

## Provider and configuration

The project uses Google Gemini through the `@google/genai` package. The server reads the API key from:

```text
GOOGLE_GENAI_API_KEY
```

The key is accessed only in server-side code. It is never passed to client components or included in browser requests. Gemini requests use the configured `gemini-3.5-flash` model with a temperature of `0.4`.

## Menu recommendations

The recommendation feature is available through `POST /api/ai/recommend` and is used in two customer experiences:

- The AI menu guide accepts a natural-language query such as a craving or meal preference.
- The cart drawer requests complementary pairings for the items currently in the cart.

The request is validated with Zod before the Gemini integration is called. The accepted input includes:

```json
{
  "cartItems": [
    {
      "id": "string",
      "name": "string",
      "category": "string",
      "price": 0
    }
  ],
  "dietaryPreferences": ["string"],
  "timeOfDay": "Lunch",
  "query": "something smoky and sweet"
}
```

The prompt supplies Gemini with the local menu catalog, the current cart, dietary preferences, time of day, and the customer query. It instructs the model to return exactly three menu recommendations, select only catalog items, preserve the catalog `itemId` and `name`, and avoid recommending items already in the cart.

Each recommendation is structured with:

```json
{
  "itemId": "string",
  "name": "string",
  "reason": "string",
  "upsellType": "pairing | popular | dessert"
}
```

The Gemini request enforces this format with `responseMimeType: "application/json"` and a `responseJsonSchema` created with the Gemini `Type` helpers. The response is parsed as JSON on the server. The client then resolves each returned ID against the local menu before displaying an Add action.

## Preparation forecast

The staff console requests `GET /api/ai/forecast`. The backend sends Gemini the local menu and order information from the recent 15-day window and asks it to estimate preparation quantities for the upcoming shift.

The forecast response is structured as:

```json
{
  "forecast": [
    {
      "itemName": "string",
      "recommendedPrepQty": 0,
      "riskLevel": "high | medium | low",
      "reasoning": "string"
    }
  ],
  "peakHourSummary": "string"
}
```

The forecast prompt constrains `itemName` values to the allowed menu and requires reasoning for each recommended quantity. The same Gemini JSON response configuration is used to enforce the object shape, required fields, and allowed risk levels. The admin page displays the forecast items, quantities, risk levels, and reasoning as operational guidance.

## Structured-output and reliability design

The shared `ask` helper centralizes model calls for both AI capabilities. It:

- requests JSON instead of free-form text;
- supplies a response schema for the expected result;
- parses the model text on the server;
- returns deterministic fallback data when the API key is missing, the model call fails, or the response cannot be parsed.

This fallback behavior keeps the demonstration usable without external AI access while making it clear that fallback results are static demo guidance rather than live model output.

## API behavior and safeguards

- Invalid recommendation request bodies return HTTP `400` from the recommendation route.
- API credentials remain server-side.
- Recommendation results are checked against the local menu before a customer can add an item.
- Prompt instructions restrict recommendations and forecast items to the known menu catalog.
- Forecasts and recommendations are advisory and should be reviewed by customers and staff, especially for dietary suitability and preparation quantities.
- Payment details, secrets, and unnecessary personal information should not be included in prompts.

## Local verification

Live Gemini responses require `GOOGLE_GENAI_API_KEY`. The AI endpoints can still be exercised locally without the key because the backend returns deterministic fallback responses.

```bash
pnpm install
pnpm lint
pnpm build
```
