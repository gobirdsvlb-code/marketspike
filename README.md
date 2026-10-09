# MarketSpike 📈

An interactive financial literacy platform for teens and adults — learn trading concepts through gamified mini-games, leaderboards, and a virtual trading experience.

## What's Inside

**River Crossing** — Answer finance questions to hop across stones. Wrong answers cost a life and leave a permanent mark. Progress through 6 difficulty levels with increasing XP multipliers.

**Virtual Trading** — Practice buying and selling stocks in a risk-free simulated market.

**Learn Curriculum** — Structured lessons covering investing fundamentals, market mechanics, and personal finance.

**Leaderboards** — Compete with other players and track your XP gains over time.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend (main) | React + Vite + TypeScript |
| Frontend (adults) | React + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Auth | Clerk |
| Database | PostgreSQL (Replit managed) |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Monorepo | pnpm workspaces |

## Project Structure

```
artifacts/
├── market-spike/     # Main teen-facing app
├── adults/           # Adult variant
└── api-server/       # Shared Express API
lib/
├── api-client-react/ # Generated API client (React Query hooks)
└── api-spec/         # OpenAPI spec + codegen
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Start all services
pnpm --filter @workspace/market-spike run dev   # Frontend → localhost:PORT
pnpm --filter @workspace/api-server run dev     # API → localhost:PORT
```

## Payments (Stripe)

Pro/Elite subscriptions and coin bundles go through `/api/payments/*`. Until
`STRIPE_SECRET_KEY` is set, the API runs in **mock mode**: checkout shows a
test-mode confirmation and no money moves. Setting the key switches to real
Stripe Checkout.

| Env var | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Enables real Stripe (leave unset for mock mode) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `POST /api/payments/webhook` |
| `APP_URL` | Optional; origin used for Checkout return URLs |
| `PAYMENTS_MODE=disabled` | Turns purchases off entirely |

Webhook events to enable: `checkout.session.completed`,
`customer.subscription.updated`, `customer.subscription.deleted`.
Run `pnpm --filter @workspace/db run push` after pulling to create the new
`payments` table and Stripe columns on `users`.

**Before launch, set the Stripe keys** — mock mode lets any signed-in user
"buy" items for free.

## Live App

[marketspike.app](https://marketspike.app)
