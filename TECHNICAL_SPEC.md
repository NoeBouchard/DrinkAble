# Drinkable — Technical Specification

Architectural reference for the Drinkable app. Scope is intentionally narrow: the parts that are *evergreen* (data model, scoring, design rationale) and that don't already live in code. Per-session planning content has been removed — see [AUDIT_2026-05-18.md](AUDIT_2026-05-18.md) for current ship state and what's next.

---

## 1. Architecture

### Technology stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + Vite | Fast HMR, ESM-native |
| Styling | Tailwind CSS 3 | Utility-first, responsive |
| Map | Mapbox GL JS | Built-in clustering, free tier (50k loads/mo) |
| Geolocation | Browser Geolocation API | Native, no extra dependency |
| AI | Claude (Anthropic) | `claude-sonnet-4-20250514` |
| Server | Vercel serverless (prod) + Express proxy (dev) | Same handler module shared between both |
| Data | Static JSON | Will move to a DB when shop count > ~150 |
| Hosting | Vercel | Zero-config for Vite + serverless `/api/*` |

### Request topology

```
User Browser
    │
    ├──> Vercel CDN     ───── Static React build (dist/)
    │
    └──> Vercel Serverless
              ├─ /api/advisor       ──> Anthropic Claude API
              ├─ /api/shop-rating   ──> Anthropic Claude API
              └─ /api/track         ──> ANALYTICS_WEBHOOK_URL (Apps Script)
```

The Anthropic key is server-only; the Mapbox token is client-only (`VITE_` prefix). The advisor logic is shared between `api/advisor.js` (serverless) and `src/server/advisor-proxy.js` (Express dev), both delegating to `src/server/advisor-handler.js` — single source of truth for prompt construction and response shaping.

---

## 2. Data model

### Coffee shop schema

Each shop in `src/data/london-shops.json` (45 entries):

```json
{
  "id": "prufrock-coffee",
  "name": "Prufrock Coffee",
  "address": "23-25 Leather Lane, London EC1N 7TE",
  "neighborhood": "Clerkenwell",
  "lat": 51.5187,
  "lng": -0.1019,
  "googleRating": 4.7,
  "scaScore": 91,
  "brewMethods": ["espresso", "v60", "aeropress", "chemex", "siphon"],
  "roaster": "House roasted with guest rotations",
  "vibes": ["minimalist", "bright", "laptop-friendly", "industrial"],
  "priceRange": "$$",
  "hours": {
    "mon": "07:00-18:00", "tue": "07:00-18:00", "wed": "07:00-18:00",
    "thu": "07:00-18:00", "fri": "07:00-18:00", "sat": "08:00-18:00",
    "sun": "10:00-18:00"
  },
  "hasWifi": true,
  "hasOutdoorSeating": false,
  "specialtyFocus": "Single-origin pour-over specialists. World Latte Art Champion on staff.",
  "description": "Award-winning Clerkenwell institution that pioneered London's third-wave movement.",
  "imageUrl": "https://images.unsplash.com/photo-1495474472902-4d71bcdd2085?w=500"
}
```

### Field specifications

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | URL-safe slug (lowercase, hyphens) |
| `name` | string | Official shop name |
| `address` | string | Full address with postcode |
| `neighborhood` | string | London area (e.g. "Shoreditch", "Soho") |
| `lat`, `lng` | number | WGS84, ±4 decimals |
| `googleRating` | number | 1.0 – 5.0 |
| `scaScore` | number | 0 – 100 (Specialty Coffee Association) |
| `brewMethods` | string[] | `espresso` · `v60` · `aeropress` · `chemex` · `siphon` · `batch-brew` · `cold-brew` · `pour-over` · `turkish` |
| `roaster` | string | Name of roaster, or "House roasted" / "Rotates guests" |
| `vibes` | string[] | `minimalist` · `cozy` · `industrial` · `bright` · `garden` · `vintage` · `hipster` · `laptop-friendly` · `quiet` · `social` |
| `priceRange` | `$` / `$$` / `$$$` | £2–4 / £4–6 / £6+ |
| `hours` | object | `{ "mon": "HH:MM-HH:MM", … "sun": "HH:MM-HH:MM" }`; use `"closed"` for closed days |
| `hasWifi` | boolean | |
| `hasOutdoorSeating` | boolean | |
| `specialtyFocus` | string | 1–2 sentences |
| `description` | string | 1–2 sentences |
| `imageUrl` | string | Currently Unsplash placeholders |

### Known gap (see audit)

Q2 onboarding asks about three preference signals — "Roaster-owned", "Recognized globally (top 100)", "Certified specialty-grade" — but the corresponding boolean fields (`roasts_own_beans`, `world_top_100`, `specialty_certified`) are **not yet on the shop objects**. The Advisor passes those priorities as free text and relies on Claude to infer matches from `specialtyFocus` / `roaster` / `description`. Adding the structured fields is on the next-session list in [AUDIT_2026-05-18.md](AUDIT_2026-05-18.md).

---

## 3. Composite scoring algorithm

Used to rank shops in the Browse view and to pick the top-10 "nearby shops" passed to the Advisor as context.

### Formula

```
compositeScore = 0.40 × normalizedSCA + 0.30 × normalizedGoogle + 0.30 × proximityScore

  normalizedSCA    = scaScore / 100
  normalizedGoogle = googleRating / 5.0
  proximityScore   = max(0, 1 − distance_km / MAX_RADIUS_KM)
  MAX_RADIUS_KM    = 5.0
```

### Weighting rationale

- **SCA (40%)** is primary — the app is for specialty enthusiasts.
- **Google rating (30%)** captures user experience; a high-SCA shop with poor service still scores down.
- **Proximity (30%)** keeps discovery local-ish without dominating; users have shown willingness to travel for quality up to ~5 km, after which the proximity bonus floors to 0.

### Example

User at `(51.5074, −0.1278)`:

| Shop | SCA | Google | Distance | Composite |
|---|---|---|---|---|
| Prufrock (Clerkenwell) | 91 | 4.7 | 0.5 km | **0.916** |
| Assembly (Brixton)     | 88 | 4.6 | 8.0 km | 0.628 |

Prufrock wins despite Assembly's strong scores: 8 km zeroes the proximity bonus.

Implementation: [src/utils/scoring.js](src/utils/scoring.js).

---

## 4. Coffee Advisor (`/api/advisor`)

### System prompt (live)

The exact prompt lives in [src/server/advisor-handler.js](src/server/advisor-handler.js) and is the canonical version — the source code is the spec. Summary: the Advisor is positioned as a London coffee local, instructed to pick exactly 3 shops from the supplied `nearbyShops`, justify each pick with concrete shop details (brew methods, vibes, hours), and never invent a shop not in the list. When `preferences.drinks` or `preferences.priorities` are present, a second paragraph is appended instructing Claude to weight them and name the matching dimension in its reasoning. The response is required to be valid JSON (no markdown fences).

### Request

```http
POST /api/advisor
Content-Type: application/json

{
  "query": "a quiet place to read this afternoon",     // optional natural-language prompt
  "userLat": 51.5074,
  "userLng": -0.1278,
  "timeOfDay": "2026-05-18T14:30:00Z",                 // ISO 8601
  "nearbyShops": [ /* up to 10 shop objects */ ],
  "preferences": {
    "drinks": ["Filter", "Flat white"],
    "priorities": ["Roaster-owned", "Recognized globally (top 100)"]
  }
}
```

### Response

```json
{
  "advice": "Two-to-three sentence opener…",
  "recommendations": [
    {
      "shopId": "prufrock-coffee",
      "shopName": "Prufrock Coffee",
      "neighborhood": "Clerkenwell",
      "reasoning": "2–3 sentences citing concrete shop attributes.",
      "googleMapsUrl": "https://www.google.com/maps/dir/?api=1&destination=…"
    }
  ]
}
```

`googleMapsUrl` is constructed server-side from `name + lat/lng` (and `placeId` if present); shop entries don't currently carry `placeId`.

### Handler sharing

- **Prod:** `api/advisor.js` (Vercel serverless wrapper)
- **Dev:** `src/server/advisor-proxy.js` (Express)

Both import and delegate to `src/server/advisor-handler.js`. Same logic, same prompt, same parsing fallbacks — don't duplicate prompt strings.

### Per-shop variant: `/api/shop-rating`

`api/shop-rating.js` → `src/server/rating-handler.js`. Powers the "Why this one?" modal on individual `ShopCard`s in the Browse view. Same Anthropic client, single-shop scope.

---

## 5. Telemetry (`/api/track`)

Fire-and-forget. Client uses [src/utils/telemetry.js](src/utils/telemetry.js) to `console.log` events with a `drinkable:` tag prefix *and* POST them to `/api/track`. The serverless function ([api/track.js](api/track.js)) forwards to `ANALYTICS_WEBHOOK_URL` (Google Apps Script endpoint), 3-second timeout, always returns 204 — never blocks or fails user-facing flows. If `ANALYTICS_WEBHOOK_URL` is unset (e.g. in dev), the endpoint early-returns 204 so local development isn't gated on the webhook.

Event registry lives in `Events` (frozen object in [src/utils/telemetry.js](src/utils/telemetry.js)). Adding a new event = add a key there + emit it from the relevant component.

---

## 6. Custom hooks

### `useGeolocation()`

Returns `{ lat, lng, error, loading }`. Falls back to central London `(51.5074, −0.1278)` on denial, timeout, or unsupported environment. Implementation: [src/hooks/useGeolocation.js](src/hooks/useGeolocation.js).

### `useShopRanking(shops, lat, lng, filters)`

Returns `shops` decorated with `compositeScore` and sorted descending, with brew-method / price / open-now filters applied. Implementation: [src/hooks/useShopRanking.js](src/hooks/useShopRanking.js).

---

## 7. Utilities

- [src/utils/scoring.js](src/utils/scoring.js) — `computeCompositeScore`, `scoreToPercentage`, `isOpenAtTime`, `filterByBrewMethods`, `filterByPriceRange`, `filterByOpenNow`, `applyFilters`.
- [src/utils/distance.js](src/utils/distance.js) — Haversine `haversineDistance(lat1, lng1, lat2, lng2)` in km, plus `formatDistance`.
- [src/utils/googleMaps.js](src/utils/googleMaps.js) — `buildDirectionsUrl({lat, lng, placeId, name})` and `directionsUrlForShop(shop)`.
- [src/utils/storage.js](src/utils/storage.js) — Safe `localStorage` wrapper; never throws even in Safari private mode. Owns the `drinkable_*` keys (onboarded flag, preferences, feature interest, tester email, location permission, recent recommendations).
- [src/utils/session.js](src/utils/session.js) — Per-browser session ID used in telemetry payloads.
- [src/utils/telemetry.js](src/utils/telemetry.js) — Event registry + `track()` helper (console log + `/api/track` POST).

---

## 8. Environment configuration

See [.env.example](.env.example) for the template. Production vars are set in the Vercel dashboard:

| Var | Where | Used by |
|---|---|---|
| `VITE_MAPBOX_TOKEN` | Client (build-time) | `src/components/Map.jsx` |
| `ANTHROPIC_API_KEY` | Server only | `advisor-handler.js`, `rating-handler.js` |
| `ANALYTICS_WEBHOOK_URL` | Server only, optional | `api/track.js` (no-op if unset) |
| `PORT` | Local dev only | Express advisor proxy (default 3001) |

Deployment specifics: [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 9. Key design decisions

### Why React + Vite?
Fast HMR, ESM-native, smaller production bundles than CRA.

### Why Mapbox GL JS over Leaflet?
Built-in clustering scales cleanly past 45 markers, better mobile performance, and the free tier (50k loads/mo) covers MVP traffic.

### Why proxy Claude server-side?
The Anthropic key must never reach the browser. The proxy also gives us a future hook for rate limiting, caching, and structured logging without changing the client.

### Why composite scoring?
Pure SCA ranking ignores proximity (sends users across town); pure proximity ignores quality (top result is a Costa). The 40/30/30 weighting tunes for "discover something good nearby" — the actual job-to-be-done.

### Why advisor-primary (S5), not map-primary?
Real testers opened the map-first build and didn't understand what the product was. The Advisor *is* the product; the map is a secondary affordance for users who want to browse. Onboarding ends with a personalised recommendation specifically so the aha moment lands before the home screen does.

### Why Tailwind?
Rapid responsive design, utility-first DX matches how we iterate on copy + layout, and the sage palette + Inter type can be tokenised cleanly.

---

## 10. Notes & gotchas

### Mapbox free tier
50,000 map loads / month. Plenty for the MVP; revisit when monthly active users exceed ~30k.

### Geolocation
HTTPS required in production (works on `localhost` in dev). If the user denies, we fall back to central London and show a one-shot toast on the Browse view.

### Claude API
Default rate limit is 50 req/min, well above MVP demand. Each `/api/advisor` call is ~1 round-trip with `max_tokens: 1024`. The shop-rating endpoint is cheaper. Both have `maxDuration: 30` configured in [vercel.json](vercel.json).

### Composite score vs. Advisor picks
The composite score ranks shops for the **Browse view**. The Advisor consumes the top-10 by composite as *context* but makes its own picks based on the user's query + preferences — so a shop that's #3 by composite can be the Advisor's top recommendation if it best matches "quiet place to read".

### Production preference-signal gap
Q2 priorities currently flow as free text to the LLM. See §2 "Known gap" and the audit for the path to structured filtering.
