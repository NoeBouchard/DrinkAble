# DrinkAble — Technical Specification

**Find your next perfect cup.**

## 1. Project Overview

### Vision
DrinkAble is a specialty coffee shop discovery web app that helps coffee enthusiasts find and explore specialty-grade cafés in their city. The MVP validates whether specialty coffee drinkers will use a discovery app that combines smart algorithmic ranking with personalized AI recommendations.

### Scope
- **MVP Goal**: Ship a fully testable, interactive web app in 4 development sessions
- **Launch City**: London
- **Target User**: Specialty coffee enthusiasts (SCA-aware, willing to travel for quality)
- **Success Metric**: Users find shops they didn't know existed and want to visit them

### Core Features
1. **Smart Shop Discovery**: All specialty coffee shops in London with SCA ratings and brew methods
2. **Composite Scoring**: Algorithm combining shop quality (SCA score), user rating (Google), and proximity
3. **Interactive Map**: Mapbox GL JS with clustering and real-time filtering
4. **Ranked List**: Shops sorted by relevance to user location and preferences
5. **Smart Filtering**: Brew method, hours (open now), price range
6. **AI Coffee Advisor**: Claude API powered recommendations based on user location and top nearby shops
7. **Responsive Design**: Mobile-first, PWA-ready (Session 4)

---

## 2. Architecture

### Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 18 + Vite | Fast builds, ESM support, excellent DX |
| **Styling** | Tailwind CSS 3 | Utility-first, responsive, production-ready |
| **Map** | Mapbox GL JS | Industry standard, free tier (50k/month), clustering |
| **Geolocation** | Browser Geolocation API | Native, no extra dependencies |
| **AI** | Claude API (claude-sonnet-4-20250514) | State-of-the-art, personalized recommendations |
| **Server** | Express.js + Vercel Serverless | Proxy Claude API safely (hide API key) |
| **Data** | Static JSON + Supabase (future) | Fast MVP, upgradeable to realtime DB |
| **Deployment** | Vercel | Zero-config for React, serverless functions |

### Deployment Architecture

```
User Browser
    ↓
[Vercel Edge] → Static assets (React build)
    ↓
[Vercel Serverless] → /api/advisor (Express proxy)
    ↓
[Anthropic Claude API]
```

**Why a proxy?**
- Hides `ANTHROPIC_API_KEY` from client (never expose in browser)
- Rate limits per user
- Adds logging/monitoring
- Upgradeable to caching layer

### Frontend Build Pipeline

```
src/ → Vite (ESM) → dist/ → Vercel CDN
```

- Dev: `npm run dev` → http://localhost:5173
- Build: `npm run build` → production-optimized dist/
- Server: `npm run server` → http://localhost:3001 (advisor proxy)

---

## 3. Data Model

### Coffee Shop Schema

Each shop is a JSON object with the following fields:

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
  "brewMethods": [
    "espresso",
    "v60",
    "aeropress",
    "chemex",
    "siphon"
  ],
  "roaster": "Has own roastery + rotates guests",
  "vibes": [
    "minimalist",
    "bright",
    "laptop-friendly",
    "industrial"
  ],
  "priceRange": "$$",
  "hours": {
    "mon": "07:00-18:00",
    "tue": "07:00-18:00",
    "wed": "07:00-18:00",
    "thu": "07:00-18:00",
    "fri": "07:00-18:00",
    "sat": "08:00-18:00",
    "sun": "10:00-18:00"
  },
  "hasWifi": true,
  "hasOutdoorSeating": false,
  "specialtyFocus": "Single-origin pour-over specialists with seasonal rotations",
  "description": "Award-winning Clerkenwell destination. Prufrock pioneered London's third-wave coffee movement. World Latte Art champion on staff. Expect queues during peak hours.",
  "imageUrl": "https://images.unsplash.com/photo-1495474472902-4d71bcdd2085?w=500"
}
```

### Field Specifications

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | URL-safe slug (lowercase, hyphens) |
| `name` | string | Official shop name |
| `address` | string | Full address with postcode |
| `neighborhood` | string | Primary London area (e.g., "Shoreditch", "Soho") |
| `lat`, `lng` | number | GPS coordinates (WGS84, ±4 decimals) |
| `googleRating` | number | 1.0 to 5.0 (from Google Maps) |
| `scaScore` | number | 0-100 (Specialty Coffee Association score) |
| `brewMethods` | array | Subset of: `espresso`, `v60`, `aeropress`, `chemex`, `siphon`, `batch-brew`, `cold-brew`, `turkish`, `pour-over` |
| `roaster` | string | Name of roaster or "House roasted" or "Rotates guests" |
| `vibes` | array | Subset of: `minimalist`, `cozy`, `industrial`, `bright`, `garden`, `vintage`, `hipster`, `laptop-friendly`, `quiet`, `social` |
| `priceRange` | string | `$` (£2-4), `$$` (£4-6), `$$$` (£6+) |
| `hours` | object | `{ "mon": "HH:MM-HH:MM", ... "sun": "HH:MM-HH:MM" }` |
| `hasWifi` | boolean | Free WiFi available |
| `hasOutdoorSeating` | boolean | Patio, garden, or street seating |
| `specialtyFocus` | string | 1-2 sentence description of specialty |
| `description` | string | 1-2 sentences about the shop |
| `imageUrl` | string | URL to shop photo (Unsplash placeholder OK for MVP) |

### Sample Data Location
`src/data/london-shops.json` contains 45 specialty coffee shops across London with realistic coordinates and ratings.

---

## 4. Composite Scoring Algorithm

### Goal
Rank shops not just by quality or proximity, but by a balanced combination of:
1. **Quality** (SCA Score) — 40%
2. **User Satisfaction** (Google Rating) — 30%
3. **Proximity** — 30%

### Formula

```
compositeScore = (0.40 × normalizedSCA) + (0.30 × normalizedGoogle) + (0.30 × proximityScore)

where:
  normalizedSCA = scaScore / 100
  normalizedGoogle = googleRating / 5.0
  proximityScore = max(0, 1 - (distance_km / MAX_RADIUS_KM))
  MAX_RADIUS_KM = 5.0
```

### Rationale

- **SCA (40%)**: Specialty score is primary — the app is for enthusiasts
- **Google (30%)**: User experience matters; a high-SCA shop with poor service scores lower
- **Proximity (30%)**: Discovery should be local, but not dominant (willing to travel for quality)
- **Max Radius**: Shops >5km away get 0 proximity bonus (still visible, ranked lower)

### Example Calculation

**User at (51.5074, -0.1278), considering two shops:**

**Shop A**: Prufrock (0.5 km away)
- SCA = 91, Google = 4.7, Distance = 0.5 km
- normalizedSCA = 0.91
- normalizedGoogle = 0.94
- proximityScore = 1 - (0.5 / 5.0) = 0.9
- **compositeScore = (0.40 × 0.91) + (0.30 × 0.94) + (0.30 × 0.9) = 0.364 + 0.282 + 0.27 = 0.916**

**Shop B**: Assembly Coffee, Brixton (8 km away)
- SCA = 88, Google = 4.6, Distance = 8 km
- normalizedSCA = 0.88
- normalizedGoogle = 0.92
- proximityScore = max(0, 1 - (8 / 5)) = 0 (too far)
- **compositeScore = (0.40 × 0.88) + (0.30 × 0.92) + (0.30 × 0) = 0.352 + 0.276 + 0 = 0.628**

**Result**: Prufrock wins (0.916 > 0.628), even though Assembly is highly-rated, because proximity is weighted and it's within the discovery radius.

### Implementation Location
`src/utils/scoring.js`

---

## 5. Coffee Advisor Feature (Claude API)

### System Prompt

```
You are a friendly, knowledgeable London coffee expert with deep knowledge of the city's specialty 
coffee scene. A user has asked for coffee shop recommendations near their current location.

You will receive:
- Their GPS coordinates (latitude, longitude)
- The 10 closest specialty coffee shops with full details (name, neighborhood, SCA score, Google rating, 
  brew methods, vibes, opening hours, description)

Your task: Recommend exactly 3 shops from the provided list. For each recommendation:
1. State the shop name and neighborhood
2. Give 2-3 specific reasons why it matches them based on:
   - Their current location and time (is it open now? convenient?)
   - Available brew methods and specialty focus
   - Vibes and atmosphere
3. Suggest what to order or experience

Be warm, encouraging, and specific. Mention details that show you understand the nuances of London's 
coffee culture. Your recommendations should feel like advice from a local coffee friend, not a 
ranked list.

Avoid generic praise. Instead of "Great coffee," say "Their seasonal single-origin pour-overs 
rotate monthly—ask about this month's Ethiopian Yirgacheffe."

If the user's location has no nearby shops within 5km, politely suggest expanding their search or 
offer alternatives.
```

### API Request Structure

**POST** `/api/advisor`

```json
{
  "userLat": 51.5074,
  "userLng": -0.1278,
  "timeOfDay": "2024-03-14T14:30:00Z",
  "nearbyShops": [
    { "id": "prufrock-coffee", "name": "Prufrock Coffee", "..." }
    // ...10 shops total
  ]
}
```

### API Response

```json
{
  "advice": "I love your location! You're right in Soho's coffee heartland. Here are my top three picks...",
  "recommendations": [
    {
      "shopId": "prufrock-coffee",
      "shopName": "Prufrock Coffee",
      "neighborhood": "Clerkenwell",
      "reasoning": "Just 0.4km away and open until 6pm. Their V60 program is exceptional—ask for the single-origin pour-over."
    },
    // ...2 more recommendations
  ]
}
```

### Implementation Location
- Proxy: `src/server/advisor-proxy.js` (Express server, Vercel Serverless)
- Client: `src/components/CoffeeAdvisor.jsx` (React component with chat UI)

### Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...
VITE_MAPBOX_TOKEN=pk_...
```

---

## 6. Component Hierarchy

```
App.jsx
├── Layout.jsx
│   ├── Map.jsx (left/top on desktop/mobile)
│   ├── ShopList.jsx (right/bottom on desktop/mobile)
│   │   └── ShopCard.jsx (×n filtered/ranked shops)
│   ├── FilterBar.jsx (top, sticky)
│   └── CoffeeAdvisor.jsx (overlay or sidebar)
```

### Component Specifications

#### `Map.jsx`
- **Purpose**: Display all shops on interactive Mapbox GL map
- **Props**: 
  - `shops` (array) — all shop data
  - `userLocation` ({lat, lng}) — user's position
  - `selectedShop` (string|null) — highlighted shop ID
  - `onSelectShop` (function) — callback when user clicks marker
- **Features**:
  - Mapbox GL with clustering
  - User location marker (blue dot)
  - Shop markers (coffee cup icon, colored by score)
  - Click marker → highlight in list
  - Placeholder UI if no VITE_MAPBOX_TOKEN
- **Tailwind Classes**: Full-width container, `relative`, `h-full`

#### `ShopList.jsx`
- **Purpose**: Scrollable ranked list of shops
- **Props**:
  - `shops` (array) — sorted by composite score
  - `selectedShop` (string|null)
  - `onSelectShop` (function)
  - `isLoading` (boolean)
- **Features**:
  - Scroll → infinite scroll pattern (Session 4)
  - Skeleton loaders while geolocation loads
  - Each item → `<ShopCard />`
  - Highlight selected shop
- **Tailwind Classes**: `overflow-y-auto`, `space-y-3`, `p-4`

#### `ShopCard.jsx`
- **Purpose**: Beautiful visual summary of one shop
- **Props**:
  - `shop` (object)
  - `isSelected` (boolean)
  - `onClick` (function)
  - `userLat`, `userLng` (for distance display)
- **Content**:
  - Shop name (bold, large)
  - Neighborhood badge
  - Composite score (0-100 as colored bar: red <60, yellow 60-79, green 80+)
  - Distance (computed from user location)
  - Brew methods (tag pills)
  - Vibes (smaller tag pills, gray)
  - Price range (£, ££, £££)
  - 1-2 sentence description
  - "Ask Advisor" button
- **Tailwind Classes**: `rounded-lg`, `shadow`, `p-4`, `cursor-pointer`, `hover:shadow-lg`, `transition`

#### `FilterBar.jsx`
- **Purpose**: Sticky filter controls above the list
- **Props**:
  - `filters` ({brewMethods, openNow, priceRange})
  - `onFiltersChange` (function)
- **Controls**:
  - Brew method multi-select (dropdown or pill buttons)
  - "Open Now" toggle (true/false)
  - Price range selector ($, $$, $$$, or "all")
  - "Reset" button to clear all filters
- **Tailwind Classes**: `sticky`, `top-0`, `bg-white`, `shadow-sm`, `p-4`, `z-10`

#### `CoffeeAdvisor.jsx`
- **Purpose**: Chat-like UI for AI recommendations
- **Props**:
  - `userLocation` ({lat, lng})
  - `topShops` (array of 10 nearest shops)
  - `onClose` (function)
- **Features**:
  - Modal or side panel
  - "Ask the Coffee Advisor" button opens panel
  - Shows loading state while fetching Claude response
  - Streams response text (or shows full response)
  - Displays 3 recommendations with reasoning
  - Copy button for recommendations
- **Tailwind Classes**: `fixed`, `inset-0`, `bg-black/50`, `flex`, `items-center`, `justify-center`

#### `Layout.jsx`
- **Purpose**: Main layout wrapper (flex, responsive split)
- **Responsive**:
  - Desktop (≥1024px): map left 60%, list right 40%
  - Tablet (640–1024px): map top 50%, list bottom 50%
  - Mobile (<640px): map hidden by default, list full width (toggle map)
- **Tailwind Classes**: `lg:flex`, `lg:h-screen`, `flex-col`, `lg:flex-row`

#### `App.jsx`
- **Purpose**: Root component, data orchestration
- **State**:
  - `shops` (loaded from JSON)
  - `userLocation` ({lat, lng, loading, error})
  - `selectedShop` (string|null)
  - `filters` ({brewMethods, openNow, priceRange})
  - `filteredAndRankedShops` (computed from shops, filters, ranking)
- **Effects**:
  - Load `london-shops.json`
  - Call `useGeolocation()` on mount
  - Recompute rankings when location/filters change
- **Renders**: `<Layout>` with all child components

---

## 7. Custom Hooks

### `useGeolocation.js`

Returns browser geolocation with fallback.

```javascript
const { lat, lng, error, loading } = useGeolocation(options)
```

**Return**:
```javascript
{
  lat: number,            // Latitude or fallback (51.5074 for central London)
  lng: number,            // Longitude or fallback (-0.1278)
  error: string | null,   // "denied", "unavailable", or null
  loading: boolean        // true while awaiting permission/response
}
```

**Options**:
```javascript
{
  timeout: 5000,          // milliseconds
  enableHighAccuracy: false // trade speed for accuracy
}
```

**Behavior**:
1. Request browser geolocation
2. On success → return user coords
3. On error or timeout → fallback to central London (51.5074, -0.1278)
4. Handle permission denied gracefully (still show map with fallback)

### `useShopRanking.js`

Ranks shops based on composite score + filters.

```javascript
const ranked = useShopRanking(shops, userLocation, filters)
```

**Params**:
- `shops` (array) — all shops
- `userLocation` ({lat, lng}) — user position
- `filters` ({brewMethods: string[], openNow: boolean, priceRange: string})

**Returns**: Sorted array of shops by composite score (descending). Filters applied:
- If `brewMethods` specified: only shops offering all selected methods
- If `openNow`: only shops open at current time
- If `priceRange`: only shops matching price ($ or $$ or $$$)

**Composite score** computed using `scoring.js` algorithm.

---

## 8. Utility Functions

### `scoring.js`

```javascript
// Compute composite score for one shop
export function computeCompositeScore(shop, userLat, userLng) {
  const distanceKm = haversineDistance(userLat, userLng, shop.lat, shop.lng)
  const normalizedSCA = shop.scaScore / 100
  const normalizedGoogle = shop.googleRating / 5.0
  const maxRadius = 5.0
  const proximityScore = Math.max(0, 1 - (distanceKm / maxRadius))
  
  return (0.40 * normalizedSCA) + (0.30 * normalizedGoogle) + (0.30 * proximityScore)
}

// Check if shop is open at given time
export function isOpenAtTime(shop, date = new Date()) {
  const dayName = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()]
  const hoursStr = shop.hours[dayName]
  if (!hoursStr) return false
  
  const [open, close] = hoursStr.split('-')
  const openTime = timeToMinutes(open)
  const closeTime = timeToMinutes(close)
  const currentTime = date.getHours() * 60 + date.getMinutes()
  
  return currentTime >= openTime && currentTime < closeTime
}

// Filter shops by brew methods (all must be present)
export function filterByBrewMethods(shops, brewMethods) {
  if (!brewMethods || brewMethods.length === 0) return shops
  return shops.filter(shop =>
    brewMethods.every(method => shop.brewMethods.includes(method))
  )
}

// Filter shops by price range
export function filterByPriceRange(shops, priceRanges) {
  if (!priceRanges || priceRanges.length === 0) return shops
  return shops.filter(shop => priceRanges.includes(shop.priceRange))
}
```

### `distance.js`

Haversine formula for great-circle distance.

```javascript
// Distance in kilometers between two lat/lng points
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
```

---

## 9. Session Breakdown

### Session 1: Foundation & Data Pipeline (2–3 hours)

**Deliverables**:
- [ ] Vite + React + Tailwind scaffolding complete
- [ ] All npm dependencies installed
- [ ] Dev server runs without errors
- [ ] `london-shops.json` loads and displays as a simple list
- [ ] `useGeolocation()` hook works (returns user location or London fallback)
- [ ] `useShopRanking()` hook computes composite scores correctly
- [ ] `ShopCard.jsx` displays all fields beautifully
- [ ] `ShopList.jsx` shows all shops ranked by score
- [ ] `FilterBar.jsx` filters by brew method, open now, price range
- [ ] `App.jsx` wires everything together
- [ ] `.env.example` defined
- [ ] No Mapbox integration yet; `Map.jsx` shows a styled placeholder

**Testing**:
- [ ] List loads and is sorted by composite score (verify ~10 closest shops are at top)
- [ ] Geolocation works (shows user distance to each shop)
- [ ] Filters work (toggle filters, see list update)
- [ ] No console errors

**Skill Check**:
Can a user run `npm run dev`, see the list, interact with filters, and understand that Mapbox will come next?

---

### Session 2: Map & Smart Filtering (2–3 hours)

**Deliverables**:
- [ ] Mapbox GL JS integrated into `Map.jsx`
- [ ] Markers for all 45 shops, clustered at zoom-out levels
- [ ] User location marker (blue dot)
- [ ] Click shop marker → highlights in list
- [ ] Click shop in list → highlights marker, pans map
- [ ] Geolocation centering: map centers on user on load
- [ ] Filtering updates both map and list in real-time
- [ ] Color-coded markers by score (red <60, yellow 60–79, green 80+)
- [ ] Popup on marker hover shows shop name, score, distance
- [ ] Responsive: map hidden on mobile by default, toggle button

**Testing**:
- [ ] Load app, map centers on user location
- [ ] Click markers and list items; sync works both directions
- [ ] Zoom in/out; clustering animates smoothly
- [ ] Filter by brew method; map updates immediately
- [ ] Mobile: toggle to show/hide map

**Skill Check**:
Does the map feel interactive and do the filters respond in real time?

---

### Session 3: AI Coffee Advisor (2–3 hours)

**Deliverables**:
- [ ] Express proxy server created (`src/server/advisor-proxy.js`)
- [ ] Server loads environment variables (ANTHROPIC_API_KEY)
- [ ] POST `/api/advisor` endpoint accepts location + top 10 shops
- [ ] Sends properly formatted request to Claude API
- [ ] Streams response back to client (or returns full response)
- [ ] `CoffeeAdvisor.jsx` component with modal/panel UI
- [ ] "Ask the Coffee Advisor" button in `ShopCard.jsx` (or header)
- [ ] Advisor receives user location + top 10 nearest shops
- [ ] Response displays 3 recommendations with reasoning
- [ ] Loading spinner while waiting for Claude
- [ ] Error handling (API key missing, rate limit, etc.)

**Testing**:
- [ ] Start with `npm run server` in one terminal, `npm run dev` in another
- [ ] Click "Ask the Coffee Advisor"
- [ ] Advisor returns 3 personalized recommendations
- [ ] Recommendations mention specific shops and reasons (brew method, distance, vibes)
- [ ] Response matches system prompt (warm, knowledgeable, local)

**Skill Check**:
Does the advisor feel like a knowledgeable London coffee friend?

---

### Session 4: Polish & Deployment (2–3 hours)

**Deliverables**:
- [ ] Mobile-first responsive design finalized
  - [ ] Touch-friendly tap targets (44px minimum)
  - [ ] Sidebar/footer toggles on mobile
  - [ ] Filter bar horizontal scroll on narrow screens
- [ ] Loading skeletons for list while geolocation loads
- [ ] Error states (geolocation denied, API errors)
- [ ] Smooth animations (transitions, hover states)
- [ ] PWA manifest (`public/manifest.json`)
- [ ] Service worker for offline fallback
- [ ] `vercel.json` configuration
- [ ] `package.json` scripts: `dev`, `build`, `server`, `preview`
- [ ] Documentation: README.md with setup instructions

**Testing**:
- [ ] Test on iPhone/Android (real device or simulator)
- [ ] Test offline: disable network, see graceful fallback
- [ ] Run `npm run build`; verify dist/ is <1MB
- [ ] Dry run: `vercel --prod` (don't push if not ready)

**Skill Check**:
Is the app deployable, mobile-friendly, and ready for real users?

---

## 10. Dependencies

### `package.json`

```json
{
  "name": "drinkable",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "server": "node src/server/advisor-proxy.js"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "mapbox-gl": "^3.0.0",
    "axios": "^1.6.0",
    "classnames": "^2.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  },
  "optionalDependencies": {
    "express": "^4.18.0",
    "@anthropic-ai/sdk": "^0.15.0",
    "cors": "^2.8.0",
    "dotenv": "^16.3.0"
  }
}
```

**Installation**:
```bash
npm install
npm install --save-dev @vitejs/plugin-react vite tailwindcss postcss autoprefixer
npm install express @anthropic-ai/sdk cors dotenv
```

---

## 11. Environment Configuration

### `.env.example`

```
# Mapbox GL JS
VITE_MAPBOX_TOKEN=pk_eyJ1IjoiYnJld3Njb3V0IiwiYSI6ImNrMzV4...

# Anthropic Claude API (for server-side advisor proxy)
ANTHROPIC_API_KEY=sk-ant-v0-1234...
```

**In development**:
```bash
cp .env.example .env.local
# Edit .env.local with your actual tokens
```

**On Vercel**:
```bash
vercel env add VITE_MAPBOX_TOKEN
vercel env add ANTHROPIC_API_KEY
```

---

## 12. Deployment Checklist

### Pre-Deployment

- [ ] All components render without errors
- [ ] No console warnings (except peer dependency warnings)
- [ ] Mobile responsive tested on actual devices
- [ ] Map loads and displays markers
- [ ] Advisor returns recommendations
- [ ] Filters work across map + list

### Vercel Setup

```bash
npm run build                    # Test build locally
vercel --prod                    # Deploy
vercel env ls                    # Verify env vars
vercel deploy --prod             # Force re-deploy if needed
```

### Post-Deployment

- [ ] Frontend loads at `drinkable.vercel.app`
- [ ] Map renders (check VITE_MAPBOX_TOKEN in build)
- [ ] Advisor works (check ANTHROPIC_API_KEY in function logs)
- [ ] Share link with test users

---

## 13. Success Metrics (MVP)

| Metric | Target | How to Measure |
|--------|--------|---|
| **Load Time** | <2s | Lighthouse score >80 |
| **Map Interactivity** | 60 FPS | Chrome DevTools performance |
| **Advisor Response** | <5s | Timer in UI |
| **Mobile UX** | Full functionality | Test on iPhone 12 + Android phone |
| **Code Quality** | No errors | `npm run build` succeeds |
| **Data Accuracy** | 45 shops + realistic coords | Spot-check 5 shops on map |

---

## 14. Future Enhancements (Post-MVP)

- [ ] User authentication + saved favorites
- [ ] Supabase integration for user reviews
- [ ] Real-time shop hours from Google Places API
- [ ] Photo gallery per shop
- [ ] Event calendar (cupping events, tasting notes)
- [ ] Export route (visit N shops in one afternoon)
- [ ] AI tasting note generation from user photos
- [ ] Expand to 10+ cities (Paris, Berlin, Tokyo, etc.)

---

## 15. File Structure Summary

```
brewscout/
├── TECHNICAL_SPEC.md
├── CLAUDE_CODE_GUIDE.md
├── package.json
├── vite.config.js
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── data/
│   │   └── london-shops.json                  (45 shops)
│   ├── components/
│   │   ├── Map.jsx                           (Mapbox placeholder)
│   │   ├── ShopCard.jsx                      (Shop summary card)
│   │   ├── ShopList.jsx                      (Ranked list)
│   │   ├── FilterBar.jsx                     (Filter controls)
│   │   ├── CoffeeAdvisor.jsx                 (AI advisor modal)
│   │   └── Layout.jsx                        (Main layout)
│   ├── hooks/
│   │   ├── useGeolocation.js                 (Browser geolocation)
│   │   └── useShopRanking.js                 (Ranking algorithm)
│   ├── utils/
│   │   ├── scoring.js                        (Composite score calc)
│   │   └── distance.js                       (Haversine distance)
│   └── server/
│       └── advisor-proxy.js                  (Express Claude proxy)
└── public/
    └── manifest.json                         (PWA manifest, Session 4)
```

---

## 16. Key Design Decisions

### Why React + Vite?
- Fast HMR, excellent DX, smaller bundle than Create React App
- ESM-native, future-proof

### Why Mapbox over Leaflet?
- Clustering built-in (scales to 45+ markers)
- Better mobile performance
- Free tier generous (50k/month)

### Why Express proxy for Claude API?
- Hide API key from browser (security)
- Rate limit per user
- Easier to monitor and log

### Why composite scoring?
- Pure ranking by quality (SCA) ignores proximity (drives local discovery)
- Pure ranking by proximity ignores quality (finds nearby bad shops)
- Balance weights enable "find nearby good shops" intent

### Why Tailwind?
- Rapid responsive design
- Production-tested utility-first CSS
- Excellent mobile-first DX

---

## 17. Notes & Gotchas

### Mapbox Free Tier
- 50,000 map loads per month (enough for MVP)
- Upgrade to pay-as-you-go if > 50k monthly users
- Always use raster tiles in production (vector is HD only)

### Geolocation
- Mobile user must approve location access (browser prompt)
- If denied, fallback to central London
- HTTPS required (not http://localhost, but works in dev)

### Claude API Rate Limits
- Default: 50 requests/minute (ample for MVP)
- Each advisor request = ~100 tokens (cheap)
- Cache system prompt in Session 3 to reduce tokens

### London Coordinates Reference
- Central London: (51.5074, -0.1278)
- North: ~51.55, South: ~51.40
- East: ~-0.05, West: ~-0.20

### CSV Data Seeding
If you later want to seed shops from CSV:
```bash
node scripts/seed-from-csv.js < shops.csv > london-shops.json
```

---

**Last updated**: April 2024
**Status**: Ready for development
**Lead**: DrinkAble Core Team

