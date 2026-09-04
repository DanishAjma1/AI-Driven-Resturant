# Ember & Grain

Ember & Grain is a restaurant ordering demo built with Next.js and TypeScript. It presents a charcoal-kitchen menu, supports cart-based ordering, provides Gemini-assisted menu recommendations, tracks order status, and includes a staff-facing kitchen console with a preparation forecast.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![pnpm](https://img.shields.io/badge/pnpm-10-orange?logo=pnpm)
![Docker](https://img.shields.io/badge/Docker-supported-blue?logo=docker)

## Features

- Landing page with featured menu categories and calls to action.
- Searchable menu catalog with category and dietary filters.
- Shared cart with quantity controls and mock order submission.
- AI menu assistant for craving-based recommendations and cart pairings.
- Customer order tracker at `/order/[id]` with automatic status polling.
- Staff kitchen console at `/admin` for monitoring and advancing orders.
- AI-assisted preparation forecast based on seeded order history.
- Deterministic AI fallback responses when Gemini is not configured or unavailable.
- In-memory order storage intended for local demos and evaluation.

## Technology

- Next.js 15 with the App Router
- React 19 and TypeScript
- Google Gemini through `@google/genai`
- Zod request validation
- Lucide React icons and Sonner notifications
- Plain CSS in `src/app/globals.css`
- pnpm and Docker support

## Requirements

Install the following before running the project locally:

- Node.js 20 or newer
- Corepack-enabled Node.js installation, or pnpm 10.12.1
- Git

Docker users need Docker Engine and Docker Compose instead of a local Node.js installation.

## Run locally

Replace `<repository-url>` with the repository’s Git URL before running these commands:

```bash
git clone <repository-url>
cd ember-table
corepack enable
corepack prepare pnpm@10.12.1 --activate
pnpm install
```

Create a local environment file if you want live Gemini responses:

```bash
printf 'GOOGLE_GENAI_API_KEY=your_gemini_api_key_here\n' > .env.local
```

The API key is optional. Without it, the application uses deterministic demo responses for the AI recommendation and forecast features.

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Production build

Run the following commands from the project directory:

```bash
pnpm lint
pnpm build
pnpm start
```

Then open [http://localhost:3000](http://localhost:3000). The `lint` script performs a TypeScript check, while `build` creates the standalone Next.js production output.

## Docker

To build and run the application with Docker Compose:

```bash
git clone <repository-url>
cd ember-table
printf 'GOOGLE_GENAI_API_KEY=your_gemini_api_key_here\n' > .env
docker compose up --build
```

The API key line is optional. The application is available at [http://localhost:3000](http://localhost:3000). Stop the container with `Ctrl+C`, or run `docker compose down` from another terminal.

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Customer landing page and AI menu guide |
| `/menu` | Searchable menu catalog and cart entry point |
| `/order/[id]` | Customer order status tracker |
| `/admin` | Staff order console and preparation forecast |
| `GET /api/items` | Returns the local menu catalog |
| `GET /api/orders` | Lists current in-memory orders |
| `POST /api/orders` | Creates a mock order |
| `GET /api/orders/[id]` | Returns one order |
| `PATCH /api/orders/[id]` | Advances an order to the next status |
| `POST /api/ai/recommend` | Returns menu recommendations or fallback data |
| `GET /api/ai/forecast` | Returns preparation forecast or fallback data |

## Project structure

```text
src/
├── app/          # Pages, layouts, global CSS, and API route handlers
├── components/   # Reusable client-side UI and cart components
├── data/         # Menu catalog and seeded demo data
├── lib/          # Gemini integration and in-memory order services
└── types/        # Shared TypeScript types
docs/
└── AI_USAGE.md   # AI development and runtime usage notes
```

## Limitations

This is a demonstration application. Orders are stored in server memory and are lost when the server restarts. It does not process payments, provide authentication, or represent a production ordering backend. A production deployment should add durable storage, authentication and authorization, payment processing, rate limiting, observability, and a real-time update mechanism.

## Improvements

Potential next improvements, outside the current demo scope, include:

- Replace the in-memory order map with a persistent database.
- Add customer and staff authentication with role-based access control.
- Integrate a payment provider and order confirmation notifications.
- Replace polling with server-sent events or WebSockets for live status updates.
- Add automated unit, integration, and end-to-end tests.
- Add production monitoring, structured logging, rate limiting, and error tracking.
- Add a managed menu and inventory workflow instead of seeded local data.

## Documentation

See [`docs/AI_USAGE.md`](docs/AI_USAGE.md) for the project’s AI development usage, runtime integration, safeguards, and verification approach.

## Maintainer

Danish Ajmal
