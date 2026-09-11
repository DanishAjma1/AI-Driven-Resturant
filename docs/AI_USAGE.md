# AI usage: `@google/genai` (`gemini-2.5-flash`)

Two features call Gemini, both under `apps/web/src/lib/gemini/`. Both are
schema-constrained (`responseSchema` + a Zod re-validation pass) and both fall
back to a deterministic local implementation when `GOOGLE_GENAI_API_KEY` is
unset or the call fails  so the app is fully evaluable without any API key,
and never crashes a page if Gemini is unreachable.

## 1\. Menu recommendation \- `/api/ai/recommend`

`lib/gemini/recommend.ts` grounds every prompt in the *actual* menu catalog
(id, name, category, description) pulled from Postgres, and enforces a
**missing-entity protocol** so the model can't hallucinate a dish:

* <b>`found`</b> \- the query matches something on the catalog; return up to 3
real items.
* <b>`alternative_suggested`</b> \- the requested dish isn't on the menu\, but a
catalog item satisfies a similar craving (e.g. cauliflower risotto for a
rice query). The model must explain the connection.
* <b>`not_available`</b> \- no reasonable substitute exists\. `message` is
required to be exactly `"Sorry, we don't provide this dish yet."`

**Guardrail:** after parsing, the route filters `recommendations` down to `itemId`s that actually exist in the catalog fetched for that request even if the model returned something outside the schema's intent, it can never
reach the customer.

**Offline fallback (`localFallback`)**: keyword/category matching against the
same catalog, including a small keyword→category map (e.g. "rice" →
Mains) so the alternative-suggestion behavior is still testable without a key.

**Category-biased pairings**: the dish detail page's "Pairs well with" panel
calls this same endpoint with `preferredCategories` set to the *opposite*
side of the menu (e.g. `["Desserts", "Drinks"]` when viewing a Mains dish,
or `["Mains", "Starters"]` when viewing a dessert/drink) so the AI leans
toward genuine cross-sell pairings rather than repeating the item itself.
The offline fallback honors this too, preferring that category pool before
falling back to popular items.

## 2\. Demand forecasting \- `/api/ai/forecast`

`lib/gemini/forecast.ts` ingests real historical `OrderItem` rows (seeded
with 21 days of timestamped orders with deliberate weekday-lunch vs.
weekend-dinner patterns), aggregates them server-side into a compact
per-item summary - **not** raw events before it ever reaches the prompt:

* units sold per day-of-week
* units sold per 2-hour window
* average daily quantity and its standard deviation

The model is asked to reason over that summary and return, per item:
`highDemandDay`, `peakDemandWindow`, `recommendedBackupQty`, `prepActionTime`,
and a `confidence` level.

**Offline fallback (`localForecast`)**: the same aggregation is used to
compute the answer analytically (top day by volume, busiest 2-hour bucket,
backup quantity sized off mean + volatility, prep time peak window minus an
hour), so `/admin/forecasting` renders real, data-grounded numbers even
without an API key.

## Why aggregate before prompting

Sending 500+ raw order-line timestamps to the model would blow up token
usage and give it no better signal than the aggregates already do. Bucketing
by day-of-week and 2-hour window server-side keeps the prompt small,
keeps the "reasoning" grounded in numbers we can also sanity-check
analytically (the fallback path), and makes the two code paths cross-checkable
against each other during development.