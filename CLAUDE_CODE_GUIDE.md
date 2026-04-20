# DrinkAble — Claude Code Session Guide

This document contains exact prompts you can paste into Claude Code for each of the 4 development sessions. Each prompt is self-contained and references the TECHNICAL_SPEC.md document to keep context high.

---

## Session 1: Foundation & Data Pipeline

**Duration**: 2–3 hours  
**Goal**: Get a working React app with data loading, geolocation, ranking, and filtering (no map yet).

### Paste this prompt into Claude Code:

```
Read TECHNICAL_SPEC.md from this project directory. You are building the DrinkAble MVP—a specialty coffee shop discovery web app for London.

YOUR TASK FOR SESSION 1:
Set up a production-ready Vite + React + Tailwind project. Create all files listed in the Session 1 deliverables:

1. PROJECT SETUP
   - Initialize package.json with all dependencies (React, ReactDOM, Tailwind, Mapbox, Axios)
   - Create vite.config.js (standard React config)
   - Create tailwind.config.js and postcss.config.js
   - Create index.html with root div and script tag
   - Create .env.example with VITE_MAPBOX_TOKEN and ANTHROPIC_API_KEY placeholders

2. DATA & HOOKS
   - Create src/data/london-shops.json with 45 real London specialty coffee shops (use realistic names, neighborhoods, coordinates, SCA scores 82-92, Google ratings 4.2-4.8, brew methods, vibes, descriptions)
   - Create src/hooks/useGeolocation.js: Returns {lat, lng, loading, error}. Falls back to central London (51.5074, -0.1278) if denied or timeout.
   - Create src/hooks/useShopRanking.js: Takes shops, userLat/lng, filters. Returns shops sorted by composite score.
   - Create src/utils/distance.js: Implement Haversine formula to calculate distance between two lat/lng points in km.
   - Create src/utils/scoring.js: Implement composite score algorithm: (0.4 × SCA/100) + (0.3 × GoogleRating/5) + (0.3 × proximity), where proximity = max(0, 1 - distance/5km)

3. STYLING
   - Create src/index.css with Tailwind directives (@tailwind base, components, utilities) and any custom styles for map container placeholders

4. COMPONENTS
   - Create src/components/Map.jsx: Placeholder that displays "Map rendering will be added in Session 2" with nice styling. Accept props: shops, userLocation, selectedShop, onSelectShop. Don't try to integrate Mapbox yet.
   - Create src/components/ShopCard.jsx: Display one shop as a beautiful card. Show: name, neighborhood badge, composite score (0-100 as colored bar: red <60, yellow 60-79, green 80+), distance from user, brew methods (tag pills), vibes (smaller gray pills), price range, description, "Ask Advisor" button.
   - Create src/components/ShopList.jsx: Scrollable list of ShopCards. Props: shops (array), selectedShop (string|null), onSelectShop (function), isLoading (boolean). Show skeleton loaders while geolocation loads.
   - Create src/components/FilterBar.jsx: Horizontal sticky filter controls. Props: filters ({brewMethods: string[], openNow: boolean, priceRange: string[]}), onFiltersChange (function). Include: brew method multi-select (pills or dropdown), "Open Now" toggle, price range selector ($, $$, $$$), reset button.
   - Create src/components/CoffeeAdvisor.jsx: Placeholder modal/panel that says "Ask the Coffee Advisor" button. Props: userLocation, topShops, onClose. Don't integrate Claude API yet; just show the button and modal skeleton.
   - Create src/components/Layout.jsx: Main layout wrapper. Desktop (≥1024px): map left 60%, list right 40%. Mobile (<640px): map hidden, list full-width. Use Tailwind: lg:flex, flex-col, lg:flex-row, lg:h-screen.

5. MAIN ENTRY
   - Create src/main.jsx: Standard React entry with ReactDOM.createRoot
   - Create src/App.jsx: Root component that:
     a. Loads shops from json using fetch() in useEffect
     b. Calls useGeolocation() on mount
     c. Calls useShopRanking(shops, userLoc, filters) to get ranked array
     d. Manages state: shops, userLocation, selectedShop, filters, filteredRanked
     e. Renders <Layout> with <Map>, <ShopList>, <FilterBar>, <CoffeeAdvisor>
     f. Passes down props and callbacks for selection + filtering

6. VERIFICATION
   - Run: npm install
   - Run: npm run dev
   - Verify: App loads at http://localhost:5173
   - Verify: london-shops.json loads and displays as a list (no errors in console)
   - Verify: Filters work—toggle brew methods, open now, price range; list updates
   - Verify: Geolocation works—list shows distances to each shop from user location
   - Verify: Composite scores are calculated correctly (spot check 2-3 shops in the top 10)
   - Verify: Map placeholder displays with nice styling
   - Verify: No console errors

QUALITY STANDARDS:
- All components are fully functional (not stubs)
- All CSS is Tailwind (no inline styles except for dynamic colors)
- Scoring algorithm matches TECHNICAL_SPEC.md exactly
- Geolocation gracefully handles denied/unavailable (shows UI, just with London fallback)
- ShopCard is visually polished: good spacing, hover states, readable typography
- The app is ready for Session 2 (Mapbox integration will drop in as a prop change)

Output each file completely—no truncation. When done, summarize the file count created and confirm the dev server is running.
```

---

## Session 2: Map & Smart Filtering

**Duration**: 2–3 hours  
**Goal**: Integrate Mapbox GL JS, add real-time filtering sync between map and list.

### Paste this prompt into Claude Code:

```
Read TECHNICAL_SPEC.md. You are continuing the DrinkAble MVP. The React app from Session 1 is working.

YOUR TASK FOR SESSION 2:
Integrate Mapbox GL JS into the Map component and add interactive filtering between map and list.

1. MAPBOX INTEGRATION IN Map.jsx
   a. Import mapbox-gl
   b. Use useRef + useEffect to initialize a Mapbox GL instance
   c. Require user to set VITE_MAPBOX_TOKEN in .env.local (show helpful error if missing)
   d. Plot all shops as markers with custom styling:
      - Color by composite score: red <60, yellow 60-79, green 80+
      - Icon: coffee cup or custom marker
      - Size/opacity scales with score
   e. Add user location marker (blue dot) centered from useGeolocation
   f. Enable clustering: at zoom <13, merge nearby markers into clusters (show count)
   g. On marker click: call onSelectShop(shopId) to highlight in list
   h. On list item click: fly map to that shop, highlight marker
   i. On filter change: update displayed markers (remove filtered-out shops, keep rest visible)
   j. Initial load: center map on user location with zoom ~12

2. USER EXPERIENCE
   a. Mobile: Add toggle button (top-left) "Show Map" / "Hide Map" to switch between map and list on small screens
   b. Hover marker: Show shop name + composite score in popup
   c. Click marker: Same as list click—highlight both map and list
   d. Filtering: Apply in real-time to both map markers and list items
   e. Zoom animations: Smooth transitions when flying to a shop

3. RESPONSIVENESS
   - Desktop (≥1024px): Map left 60%, list right 40%, side-by-side
   - Tablet (640–1024px): Map top 50%, list bottom 50%, stacked
   - Mobile (<640px): Map hidden by default, list full-width, toggle button shows map in overlay/modal

4. VERIFICATION
   - Run: npm run dev
   - Set VITE_MAPBOX_TOKEN in .env.local (get a free token from mapbox.com if needed)
   - Verify: Map renders with all 45 shop markers
   - Verify: User location marked (blue dot, centered on map)
   - Verify: Click marker → list highlights that shop
   - Verify: Click list item → map marker highlights + map pans to it
   - Verify: Zoom in/out; clustering works at zoom out
   - Verify: Filters update map in real-time (select brew method, markers disappear for non-matching shops)
   - Verify: Mobile responsive—toggle works, map hides/shows correctly
   - Verify: No console errors, smooth 60 FPS on interactions

QUALITY STANDARDS:
- Mapbox initialization is clean and error-handled
- Markers are visually distinct by score (color coding)
- Sync between map and list is instant (no lag)
- Clustering is animated smoothly
- Touch-friendly on mobile (markers are large enough to tap)
- Code follows React best practices (useRef, useEffect, cleanup)

Output all modified files completely. Confirm the map displays and syncs with the list.
```

---

## Session 3: AI Coffee Advisor

**Duration**: 2–3 hours  
**Goal**: Build Express proxy server + Claude API integration + chat UI.

### Paste this prompt into Claude Code:

```
Read TECHNICAL_SPEC.md. You are continuing the DrinkAble MVP. The map and list from Session 2 are working.

YOUR TASK FOR SESSION 3:
Build the Coffee Advisor feature: a backend proxy for the Claude API + a React UI for recommendations.

1. BACKEND: Express Proxy Server (src/server/advisor-proxy.js)
   a. Create an Express server listening on port 3001 (or env var PORT)
   b. Load ANTHROPIC_API_KEY from .env (use dotenv)
   c. Create POST /api/advisor endpoint that:
      - Accepts JSON: { userLat, userLng, timeOfDay, nearbyShops }
      - nearbyShops is array of 10 closest shops (full objects from london-shops.json)
      - timeOfDay is ISO 8601 timestamp (for context about opening hours)
   d. Prepare Claude API request:
      - Use @anthropic-ai/sdk to instantiate Anthropic client
      - System prompt: "You are a friendly, knowledgeable London coffee expert with deep knowledge of the city's specialty coffee scene. A user has asked for coffee shop recommendations near their current location. You will receive their GPS coordinates and the 10 closest specialty coffee shops with full details. Your task: Recommend exactly 3 shops from the provided list. For each recommendation, state the shop name and neighborhood, give 2-3 specific reasons why it matches them based on their location, available brew methods, vibes, and opening hours. Be warm, encouraging, and specific. Mention details that show you understand nuances of London's coffee culture."
      - User message: Format the 10 shops as clean JSON, mention user location and time
   e. Send to Claude (claude-sonnet-4-20250514 or latest available)
   f. Stream or collect response (for MVP, collect full response, ~5s max)
   g. Parse Claude's response to extract shop names and recommendations
   h. Return JSON: { advice: string, recommendations: [{ shopId, shopName, neighborhood, reasoning }, ...] }
   i. Error handling: Return 500 with error message if API key missing, API fails, etc.
   j. Add CORS headers to allow localhost:5173 (and vercel.com in production)

2. FRONTEND: CoffeeAdvisor.jsx Component
   a. Change from placeholder to real implementation
   b. State: { isOpen, isLoading, response, error }
   c. Modal/Panel that slides in from right or appears as overlay
   d. Content:
      - Title: "Coffee Advisor" with close button (X)
      - Loading state: Spinner + "Finding your perfect cup..."
      - Success state: Show response.advice (the full text Claude returned)
      - Show 3 recommendations as cards:
        * Shop name + neighborhood
        * Reasoning from Claude
        * "Visit Shop" button → link to Google Maps or shop website (future)
      - Error state: "Sorry, couldn't reach the advisor. Try again?" with retry button
   e. Trigger: "Ask Advisor" button appears in:
      - ShopCard (for individual shop)
      - OR global button in header (asks advisor for top 3 near user)
   f. Integration:
      - When opened, compute top 10 nearest shops from user location
      - POST to http://localhost:3001/api/advisor (dev) or /api/advisor (prod)
      - Stream or display response
   g. UI/UX:
      - Modal is responsive: full-screen mobile, 500px wide on desktop
      - Close button + escape key to dismiss
      - Smooth fade-in/out transitions

3. INTEGRATION IN App.jsx
   a. Identify top 10 shops by composite score (already ranked)
   b. Pass to <CoffeeAdvisor userLocation={userLocation} topShops={top10} />

4. ENV & RUN COMMANDS
   a. Update .env.example with ANTHROPIC_API_KEY
   b. Add to package.json scripts:
      - "server": "node src/server/advisor-proxy.js"
   c. To run in development:
      - Terminal 1: npm run server (starts Express on 3001)
      - Terminal 2: npm run dev (starts Vite on 5173)

5. VERIFICATION
   a. Terminal 1: npm run server → "Listening on port 3001"
   b. Terminal 2: npm run dev → Vite starts normally
   c. Open http://localhost:5173
   d. Click "Ask the Coffee Advisor" button
   e. Verify: Modal opens, shows "Finding..."
   f. Verify: ~3-5 seconds later, Claude's response appears with 3 recommendations
   g. Verify: Recommendations mention actual shop names from data (Prufrock, Monmouth, etc.)
   g. Verify: Reasoning is specific (mentions brew methods, vibes, distance, hours)
   h. Verify: No console errors; check network tab to see POST to /api/advisor
   i. Test error case: Remove ANTHROPIC_API_KEY from .env, reload; should show error

QUALITY STANDARDS:
- Claude response is warm and knowledgeable (sounds like a London coffee expert)
- Recommendations are personalized (mention specific shop details, not generic praise)
- No API key in client code (only on server)
- Error handling is graceful (user sees helpful message, not stack trace)
- Modal is polished: smooth animations, readable typography, good spacing
- Response time is <5 seconds (Claude is fast)

Output all created/modified files completely. Confirm the advisor works end-to-end.
```

---

## Session 4: Polish & Deployment

**Duration**: 2–3 hours  
**Goal**: Finalize mobile UX, add loading states, PWA support, prepare for deployment.

### Paste this prompt into Claude Code:

```
Read TECHNICAL_SPEC.md. You are in the final session of the DrinkAble MVP. Sessions 1–3 are complete.

YOUR TASK FOR SESSION 4:
Polish the app for production: responsive mobile UX, loading states, PWA basics, deployment prep.

1. MOBILE-FIRST RESPONSIVE DESIGN
   a. Review all components on actual mobile device (or DevTools device emulation)
   b. Fix responsiveness:
      - FilterBar: Horizontal scroll on mobile (pills don't wrap), sticky at top
      - ShopCard: Full-width on mobile, good padding, readable text at small sizes
      - ShopList: Touch-friendly tap targets (44px minimum height)
      - Map: Toggle button is large, easy to tap
      - CoffeeAdvisor modal: Full-screen on mobile, 500px max-width on desktop
   c. Tailwind responsive classes: Use sm:, md:, lg: prefixes throughout
   d. Layout.jsx: Ensure map/list swap correctly on mobile (map hidden by default, show with toggle)

2. LOADING & SKELETON STATES
   a. ShopList.jsx:
      - While geolocation is loading, show 5 skeleton cards (gray shimmer boxes)
      - Each skeleton is same height as real ShopCard for smooth layout
   b. App.jsx:
      - Show loading spinner while shops JSON is fetching
      - Show geolocation loading state (spinner in map container)
   c. CoffeeAdvisor.jsx:
      - Show animated loading skeleton while waiting for Claude response

3. ERROR STATES
   a. Geolocation denied: Still show list with London fallback, toast notification "Using London as fallback location"
   b. Mapbox token missing: Show helpful message in map area "Mapbox token not set. See .env.example"
   c. Advisor API error: Show "Couldn't reach the Coffee Advisor. Please try again." with retry button
   d. Shops JSON load error: Show "Failed to load shops. Please refresh the page."

4. ANIMATIONS & POLISH
   a. Smooth transitions on all interactions (Tailwind transition class)
   b. Hover states: ShopCard, buttons, links all have subtle hover feedback
   c. Map interactions: Flying to a shop is animated (smooth zoom + pan)
   d. Modal open/close: Fade in/out with scale (subtle)
   e. Filter changes: List updates with fade (not jarring)

5. PWA BASICS (Session 4 deliverable)
   a. Create public/manifest.json:
      - name: "DrinkAble"
      - short_name: "DrinkAble"
      - description: "Find your next perfect cup"
      - start_url: "/"
      - display: "standalone"
      - theme_color: "#1f2937"
      - background_color: "#ffffff"
      - icons: [ { src: "/icon-192.png", sizes: "192x192", type: "image/png" }, ... ]
   b. Create src/service-worker.js:
      - Cache app shell (HTML, CSS, JS)
      - Cache london-shops.json on first load
      - Serve from cache if offline
      - Show offline message if map/advisor is unavailable
   c. Register service worker in src/main.jsx (after React mount)
   d. Add <link rel="manifest"> to index.html
   e. Add <meta name="theme-color"> to index.html

6. BUILD & PERFORMANCE
   a. Run npm run build
   b. Verify dist/ is <1MB total (gzipped)
   c. Test build locally: npm run preview
   d. Check Lighthouse score (aim for >80 across metrics)

7. DEPLOYMENT CONFIGURATION
   a. Create vercel.json:
      ```json
      {
        "buildCommand": "npm run build",
        "outputDirectory": "dist",
        "env": {
          "VITE_MAPBOX_TOKEN": "@vite-mapbox-token",
          "ANTHROPIC_API_KEY": "@anthropic-api-key"
        },
        "functions": {
          "src/server/advisor-proxy.js": {
            "runtime": "nodejs18.x"
          }
        }
      }
      ```
   b. Update package.json:
      - Ensure "type": "module"
      - scripts: { "dev", "build", "preview", "server" }
   c. Add README.md:
      - Project description
      - Setup instructions (git clone, npm install, .env.local, npm run dev)
      - How to deploy to Vercel
      - How to get API keys (Mapbox, Anthropic)
      - Session breakdown

8. DOCUMENTATION
   a. Create DEPLOYMENT.md (or section in README):
      - Step-by-step: Create Mapbox account, get token
      - Step-by-step: Get Anthropic API key
      - How to deploy to Vercel (vercel login, vercel, env vars)
      - How to run locally with both dev server and advisor proxy
   b. Update .env.example with clear comments

9. FINAL VERIFICATION CHECKLIST
   ✓ npm run build succeeds (no errors)
   ✓ npm run preview runs the production build locally
   ✓ Mobile responsive: Test on 4 screen sizes (iPhone SE 375px, iPhone 14 390px, iPad 768px, Desktop 1440px)
   ✓ Touch interactions: All buttons/inputs are 44px+ tall
   ✓ Loading states: Geolocation, shops load, advisor loading all show skeletons
   ✓ Error states: Test with missing tokens, offline mode, API errors
   ✓ Map still works, list still works, filters work on all screen sizes
   ✓ Advisor works end-to-end (locally: npm run server + npm run dev)
   ✓ No console errors or warnings
   ✓ Lighthouse score >80 (run npm run build && npm run preview, then Lighthouse in DevTools)

10. DEPLOYMENT (DRY RUN)
    a. Install Vercel CLI: npm install -g vercel
    b. Set up: vercel login (if not already)
    c. Deploy: vercel --prod (or just vercel for preview)
    d. Set env vars:
       - vercel env add VITE_MAPBOX_TOKEN (paste token)
       - vercel env add ANTHROPIC_API_KEY (paste key)
    e. Re-deploy: vercel --prod
    f. Verify:
       - Frontend loads at https://drinkable.vercel.app
       - Map renders (Mapbox token working)
       - Advisor works (ANTHROPIC_API_KEY working)
       - No 500 errors in Vercel logs

QUALITY STANDARDS:
- App is fully responsive and touch-friendly
- No jank or layout shift (smooth interactions)
- Loading states give user feedback (no blank screen)
- Error messages are helpful and actionable
- Performance is snappy (<2s page load)
- Production build is <1MB gzipped
- Ready for real users and external testing

Output all created/modified files completely. Provide a summary of all Session 4 additions. Confirm the build is successful and the app is deployment-ready.
```

---

## How to Use This Guide

### For Each Session:

1. **Open Claude Code** (or use Claude in your terminal)
2. **Paste the entire session prompt** into a new Claude Code session
3. **Press Enter** to start Claude on that task
4. **Claude will:**
   - Read TECHNICAL_SPEC.md from your project directory
   - Create all necessary files
   - Verify the dev server runs and all features work
   - Output a summary

### Between Sessions:

- **Session 1 → 2**: Confirm dev server is running and no errors. Then start Session 2.
- **Session 2 → 3**: Add VITE_MAPBOX_TOKEN to .env.local. Start Session 3 in a new Claude Code window (keep dev server running).
- **Session 3 → 4**: Have both `npm run server` (Terminal 1) and `npm run dev` (Terminal 2) running. Then start Session 4.

### Key Commands:

```bash
# Session 1 setup
npm install
npm run dev

# Session 2 + Session 3 (two terminals)
npm run server       # Terminal 1
npm run dev          # Terminal 2

# Session 4 verification
npm run build
npm run preview

# Deployment
npm install -g vercel
vercel --prod
```

---

## Notes

- **Total time**: 8–12 hours across 4 sessions (2–3 hours each)
- **Output**: A fully functional, mobile-responsive, AI-powered coffee shop discovery app
- **Next**: Deploy to Vercel and share with beta testers
- **Questions?**: Refer back to TECHNICAL_SPEC.md for architecture details

---

**Ready to build DrinkAble!**

