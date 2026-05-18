# Drinkable

**Personalized, conversational coffee recommendation from a knowledgeable expert.**

A specialty coffee shop discovery web app for London. The Coffee Advisor (Claude-powered) is the front door — type what you're looking for, get three matched recommendations with reasoning, open in Google Maps. Production: https://drinkable-drab.vercel.app.

## How it works

1. **Onboarding (first visit)** — splash → drinks you usually order → priorities → location → first AI recommendation as the aha moment.
2. **Advisor home** — single text input ("What are you looking for right now?") + quick-prompt chips. Submitting calls `/api/advisor`, which sends the top-10 nearest shops to Claude and returns 3 ranked picks with reasoning + a Google Maps link.
3. **Browse view (secondary)** — map + filtered list + filters, reached from the top-nav or a recommendation's "Show on map".

## Tech stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Map:** Mapbox GL JS (Browse view only)
- **AI:** Claude (Anthropic) via Vercel serverless function
- **Telemetry:** fire-and-forget POST to `/api/track` → Apps-Script webhook
- **Hosting:** Vercel (static frontend + serverless `/api/*`)
- **Data:** static JSON (`src/data/london-shops.json`, 45 shops)

## Quick start

```bash
git clone <repo-url>
cd drinkable
npm install
cp .env.example .env.local
# edit .env.local with real tokens (see DEPLOYMENT.md for where to get them)

# in two terminals:
npm run dev        # Vite at http://localhost:5173
npm run server     # Express advisor proxy at http://localhost:3001
```

Required env vars (see `.env.example`):
- `VITE_MAPBOX_TOKEN` — public Mapbox token for the Browse-view map
- `ANTHROPIC_API_KEY` — server-side Claude key for `/api/advisor` and `/api/shop-rating`
- `ANALYTICS_WEBHOOK_URL` *(optional)* — Apps-Script endpoint for `/api/track` forwarding

Deployment details, env-var setup on Vercel, and troubleshooting are in [DEPLOYMENT.md](DEPLOYMENT.md).

## Composite scoring (Browse-view ranking)

Shops in the Browse view are ranked by:

```
score = 0.40 × (scaScore / 100) + 0.30 × (googleRating / 5) + 0.30 × proximity
proximity = max(0, 1 − distance_km / 5)
```

Implementation: [src/utils/scoring.js](src/utils/scoring.js). The Advisor doesn't use this score directly — it sends the top-10 nearest shops (sorted by composite) as context to Claude.

## API

### `POST /api/advisor`

Request body:
```json
{
  "query": "a quiet place to read this afternoon",
  "userLat": 51.5074,
  "userLng": -0.1278,
  "timeOfDay": "2026-05-18T14:30:00Z",
  "nearbyShops": [ /* up to 10 shop objects */ ],
  "preferences": { "drinks": ["Filter"], "priorities": ["Roaster-owned"] }
}
```

Response:
```json
{
  "advice": "Two-to-three sentence opener…",
  "recommendations": [
    { "shopId": "prufrock-coffee", "shopName": "Prufrock Coffee",
      "neighborhood": "Clerkenwell", "reasoning": "…",
      "googleMapsUrl": "https://www.google.com/maps/dir/?api=1&…" }
  ]
}
```

### `POST /api/shop-rating`

Per-shop "Why this one?" Claude review — see [src/server/rating-handler.js](src/server/rating-handler.js).

### `POST /api/track`

Fire-and-forget telemetry forwarder; client uses [src/utils/telemetry.js](src/utils/telemetry.js). See [api/track.js](api/track.js).

## Filtering (Browse view)

- **Brew methods:** `espresso`, `v60`, `aeropress`, `chemex`, `siphon`, `batch-brew`, `cold-brew`, `pour-over`
- **Price:** `$` / `$$` / `$$$`
- **Open now:** computed from each shop's `hours.{day}` against current time

## Project state and roadmap

The current state of the app — what's shipped, what's deployed, what's planned — lives in [AUDIT_2026-05-18.md](AUDIT_2026-05-18.md). Architectural reference (data model, scoring, design rationale) is in [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md). Historical session prompts (S1–S5) are archived under [docs/archive/](docs/archive/).

## License

MIT
