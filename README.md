# Ember & Grain - Restaurant Management Platform

A production-ready restaurant platform: customer ordering, live order tracking,
role-specific kitchen/driver consoles, and an admin suite with Recharts
analytics and Gemini-powered demand forecasting.

Built with **Next.js (App Router) · TypeScript · Tailwind CSS · Prisma ·
PostgreSQL · Recharts · `@google/genai` (`gemini-2.5-flash`)**, in a `pnpm`
monorepo.

## Architecture

```
apps/
  web/                 Next.js App Router app — pages, API route handlers,
                        RBAC middleware, and the Gemini AI services.
packages/
  db/                  Prisma schema, generated client, seed script.
  shared/               Domain types, DTOs, and Zod schemas shared between
                        the UI and API route handlers.
```

**A note on `apps/api`:** this platform's backend is entirely implemented as
Next.js Route Handlers inside `apps/web/src/app/api/**` rather than a separate
service, since there's no requirement here for a backend independent of
Next.js. `packages/shared` still enforces the "no duplicated types" rule from
`AGENTS.md` between the UI and those route handlers; if a standalone
`apps/api` is ever introduced, it would import from the same package.

### Layer isolation

- **UI (Server/Client Components)** never imports `@ember-grain/db` directly —
  only `apps/web/src/lib/data/*` does. Pages call those data-access functions;
  client components talk to the API routes.
- **API routes** are thin: parse with Zod, call a `lib/data/*` function or a
  Gemini service, return an `ApiResult` envelope via `withErrorHandling`.
- **`middleware.ts`** is the zero-trust gate for `/admin`, `/portal/kitchen`,
  `/portal/driver`, `/cart`, `/checkout`, `/my-orders` and their API mirrors.
  Route handlers re-check role with `requireRole()` as defense in depth.

## Getting started

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
cp packages/db/.env.example packages/db/.env
# edit apps/web/.env: set a real JWT_SECRET (openssl rand -base64 48)

docker compose up -d postgres         # or point DATABASE_URL at your own Postgres
pnpm db:migrate                       # creates tables
pnpm db:seed                          # demo users, menu, 21 days of order history

pnpm dev                              # http://localhost:3000
```

Order display IDs are allocated by a PostgreSQL sequence and formatted as
`EG-<number>`. Production deployments must apply migrations before starting
the application:

```bash
pnpm db:migrate:deploy
```

### Demo accounts

All seeded accounts use the password `1234`:

| Role     | Email                     |
| -------- | -------------------------- |
| Admin    | admin@embergrain.dev       |
| Cook     | cook@embergrain.dev        |
| Driver   | driver@embergrain.dev      |
| Customer | jordan@example.com         |

Seeding also creates three sample `DiscountRule`s you can see applied on the
menu right away: `HAPPYHOUR` ($3 off Drinks), `WEEKEND15` (15% off
everything, scheduled for the next 7 days), and `RIBSPECIAL` ($5 off the
Smoked Short Rib specifically).

### Demo OTP for dine-in payment

The mock dine-in payment verification (see **Dual fulfillment & payment
verification** below) accepts any 13–19 digit card number that passes a
Luhn check with a future expiry, or a mobile wallet number + the fixed demo
OTP `123456`. Nothing here charges a real payment method.

### Environment variables

| Variable                | Where                | Required | Notes                                                        |
| ------------------------ | --------------------- | -------- | -------------------------------------------------------------- |
| `DATABASE_URL`           | `apps/web`, `packages/db` | ✅       | PostgreSQL connection string                                  |
| `JWT_SECRET`              | `apps/web`             | ✅       | ≥32 chars, signs session cookies                               |
| `GOOGLE_GENAI_API_KEY`    | `apps/web`             | Optional | Without it, `/api/ai/recommend` and `/api/ai/forecast` fall back to a local heuristic/analytical implementation, so the app is fully evaluable offline. |
| `RESEND_API_KEY`          | `apps/web`             | ✅       | API key for the Resend transactional email service               |
| `EMAIL_FROM`              | `apps/web`             | ✅       | Verified From address used for password-reset emails            |
| `NEXT_PUBLIC_APP_URL`     | `apps/web`             | ✅       | Used to build password-reset links                              |

Env vars are validated at boot via `apps/web/src/env.ts` (Zod) — never read
`process.env` directly in feature code.

## Scripts (run from the repo root)

| Script              | What it does                                   |
| -------------------- | ------------------------------------------------ |
| `pnpm dev`            | Start the Next.js dev server                     |
| `pnpm build`           | Generate the Prisma client, build `apps/web`      |
| `pnpm typecheck`       | `tsc --noEmit` across every workspace             |
| `pnpm lint`            | Lint `apps/*`                                     |
| `pnpm test`            | Run tests in every workspace that defines one     |
| `pnpm db:migrate`      | `prisma migrate dev`                              |
| `pnpm db:seed`         | Re-run the seed script                            |
| `pnpm db:studio`       | Open Prisma Studio                                |

## Domain model

See `packages/db/prisma/schema.prisma`. Core entities:

- **`User`** — role: `CUSTOMER` / `COOK` / `DRIVER` / `ADMIN`.
- **`MenuItem`** — includes `calories` and `ingredients` for the dish detail
  page, plus `tags` (dietary/attribute badges: Vegan, Vegetarian,
  Gluten-Free, Halal, Nut-Free, **Spicy**).
- **`Order`** — human-readable `displayId` like `EG-1048` (allocated
  atomically via the Postgres sequence `order_display_id_seq`, so concurrent
  checkouts can't collide); status machine `RECEIVED → PREPARING → PREPARED →
  OUT_FOR_DELIVERY → DELIVERED` (or `CANCELLED`) — a `DINE_IN` order may also
  jump `PREPARING → DELIVERED` directly ("served"), since there's no driver
  hand-off. Also carries `fulfillmentType`, delivery/table fields, and
  payment fields — see **Dual fulfillment** below.
- **`OrderItem`** — `priceAtTime` is the price actually charged, i.e.
  *after* any discount that was live at checkout.
- **`DiscountRule`** — see **Promotions & discounts** below.

## Adaptive navigation

`components/navigation/Navbar.tsx` and `Footer.tsx` render differently by
role (`NavRole = UserRole | "ANONYMOUS"`):

- **Anonymous / Customer** — full nav (Home, Menu, About, Contact, Track
  Order), cart with a live badge count, sign-in/account control. Footer is
  the rich 4-column layout (brand, quick links, legal, newsletter).
- **Admin** — the same public nav plus a management-suite link group
  (Dashboard, Menu Manipulation, Promotions, Demand Forecast, Kitchen/Driver
  Portal). When an admin browses the menu, `DishCard` swaps its "Add to
  cart" button for an "Edit dish" shortcut into `/admin/menu`.
- **Cook / Driver** — a minimal, distraction-free header (no public nav, no
  cart) with an active-duty indicator and a link to their own console. The
  footer becomes a centered ops footer with emergency kitchen/driver contact
  info and a build timestamp instead of the marketing footer.

## Promotions & discounts

`/admin/discounts` manages `DiscountRule` rows: `PERCENTAGE` or
`FIXED_AMOUNT`, scoped `GLOBAL` / `CATEGORY` / `SELECTIVE_ITEMS`, optionally
time-boxed (`isScheduled` + `startDate`/`endDate`) on top of a manual
`isActive` toggle.

Effective prices are **computed at read time**, never stored on the item —
`lib/data/discounts.ts#applyDiscounts` picks the best-applicable live rule
per item (largest saving wins if more than one rule could apply) and
`lib/data/menu.ts` attaches the result to every `MenuItemDTO` as `discount`.
`DishCard`/`DishPrice` render the crossed-out original price + discounted
price automatically wherever a `MenuItemDTO` is shown. **Checkout
re-derives the discount server-side** from the live rules at order time —
the client-submitted cart price is never trusted, and a rule that expired
between page load and checkout can't be exploited.

## Dual fulfillment & payment verification

Checkout (`/checkout`) offers two fulfillment paths:

- **`DELIVERY`** — requires an address + contact phone; paid on receipt
  (no payment fields at checkout).
- **`DINE_IN`** — requires a table number *and* upfront payment to hold the
  table. An unverified `DINE_IN` order is **rejected before it's ever
  persisted** — `lib/data/orders.ts#createOrder` calls
  `lib/payments/mockVerify.ts` first and throws a `ValidationError` on
  failure, so nothing unpaid ever reaches `/portal/kitchen`.

  ⚠️ **`mockVerify.ts` is a demo, not a real payment integration.** It does
  format/Luhn/expiry checks on card details and an OTP match
  (`123456`, printed in the checkout UI) for mobile wallet — no processor is
  called, no funds move, and none of this is PCI-DSS compliant. A real
  deployment would tokenize payment details client-side and call an actual
  gateway; the raw card/OTP fields here exist only to make the demo flow
  self-contained.

Kitchen and driver consoles adapt accordingly: a cook can serve a `DINE_IN`
order straight from `PREPARING` to `DELIVERED` (no driver needed), while
`/portal/driver`'s board only ever shows `DELIVERY` orders.

## AI features

See [`docs/AI_USAGE.md`](./docs/AI_USAGE.md) for how the recommend and
forecast endpoints are grounded, validated, and fall back safely offline.
The dish detail page's "Pairs well with" panel also biases `/api/ai/recommend`
toward complementary categories (e.g. suggesting a dessert or drink for a
main course) via `preferredCategories`.

## CI/CD

- `.github/workflows/ci.yml` — matrix-tests Node 20.x/22.x on PRs to
  `main`/`develop`: install → typecheck → lint → `prisma generate` → test,
  against a real Postgres service container.
- `.github/workflows/deploy.yml` — on merge to `main`: build, run
  `prisma migrate deploy`, then hand off to your hosting provider's deploy
  step (placeholder — wire up Vercel/Fly/your registry here).

## Docker

```bash
docker compose up --build
```

Brings up Postgres and the app (multi-stage build, Next.js `standalone`
output) on `http://localhost:3000`. Set `JWT_SECRET` and
`GOOGLE_GENAI_API_KEY` in your shell or a `.env` file before running — see
`docker-compose.yml`.
