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

## Session 5: JTBD Reframe, Onboarding & Advisor-Primary UI

**Duration**: 3–4 hours
**Goal**: Reframe the app so the Coffee Advisor is the front door, not the map. Add an onboarding flow that captures preferences and delivers a first personalised recommendation as the aha moment. Migrate the visual system to the new "Drinkable" brand (sage palette, Inter, Mark01 logo).

### Context you need before starting

The MVP is live at https://drinkable-drab.vercel.app. Real testers opened it and didn't know what it was for. Diagnosis: the Advisor is the product, but the map is the front door — backwards. The rename from "BrewScout" → "Drinkable" already happened at the folder level; this session propagates it through the UI, copy, and brand.

**Core JTBD (locked):** "When I'm in London and I want a great coffee experience, DrinkAble tells me exactly where to go and why, based on what I actually like."

**Locked tagline** (use verbatim on the splash screen and in meta tags): *"Personalized, conversational coffee recommendation from a knowledgeable expert."*

**What is NOT in scope this session:** expanding the shop database past 45 (that's Session 6), adding login/accounts, building the community/bean-marketplace/B2B features (parked).

### Paste this prompt into Claude Code:

```
Read TECHNICAL_SPEC.md and CLAUDE_CODE_GUIDE.md from this project directory. You are continuing the DrinkAble MVP. Sessions 1–4 shipped and the app is live in production. This session reframes the product around its real Job To Be Done.

CONTEXT — WHY THIS SESSION EXISTS:
Real testers opened the app and didn't understand what it was for. The map-first layout buries the actual product, which is the Coffee Advisor. Session 5 makes the Advisor the front door, adds an onboarding flow that turns "what is this?" into "oh, it told me exactly where to go" within the first 60 seconds, and migrates the brand from the BrewScout-era visuals to the new Drinkable design system.

Core JTBD (locked — do not re-scope): "When I'm in London and I want a great coffee experience, Drinkable tells me exactly where to go and why, based on what I actually like."

Locked tagline (use verbatim): "Personalized, conversational coffee recommendation from a knowledgeable expert."

YOUR TASK FOR SESSION 5:

1. DESIGN SYSTEM MIGRATION
   a. Create src/components/Logo.jsx that exports a single <Logo size={n} /> component. Extract the "Mark01" (half-full glass) SVG from ./Design/logos.jsx — the one with the glass outline and sage-filled lower half. Ship it as:
      - <Logo size={n} />        → mark only
      - <LogoLockup size={n} />  → mark + "drinkable" wordmark in Inter 500, tracking -1 to -2
      The wordmark should be all lowercase.
   b. Update tailwind.config.js to extend the theme with the Drinkable palette. Use HEX fallbacks alongside OKLCH (Tailwind's JIT needs values it can parse — keep the HEX as the Tailwind class value and add CSS vars in index.css for the OKLCH versions):
      - bg:        #f6f4ef   (warm off-white)
      - sage:      #86a192   (primary accent — approximation of oklch(0.72 0.06 155))
      - sageDeep:  #4f6b5c   (hover/pressed — approximation of oklch(0.52 0.07 155))
      - sageLight: #d6e0d9   (fills/surfaces — approximation of oklch(0.88 0.04 155))
      - ink:       #2d3a33   (primary text — approximation of oklch(0.28 0.03 155))
      - inkSoft:   #5d6b64   (secondary text — approximation of oklch(0.45 0.02 155))
      Expose each as a CSS variable in src/index.css so the exact OKLCH is used on browsers that support it, with the HEX as fallback.
   c. Add Inter to index.html via Google Fonts (<link rel="preconnect"> + stylesheet with weights 300;400;500;600;700). Set Tailwind's default sans font-family to Inter, system-ui, -apple-system, sans-serif.
   d. Update index.html <title> to "Drinkable — find your next coffee", <meta name="description"> to the locked tagline, and <meta name="theme-color"> to #86a192 (sage).
   e. Update public/manifest.json: name "Drinkable", short_name "Drinkable", description = locked tagline, theme_color #86a192, background_color #f6f4ef.
   f. Do a global sweep of all existing .jsx/.css files and replace any BrewScout-era colors (grays, blues, the old accent) with the new palette via the Tailwind tokens you just added. Do NOT remove existing class structure — just re-map colors.
   g. Update index.html favicon to a rasterised version of the Mark01 glyph (inline SVG data-URI is fine for now).

2. ONBOARDING FLOW (NEW)
   Create a full-screen onboarding experience at src/components/onboarding/ that runs the first time a user lands (detected via localStorage key `drinkable_onboarded`). It has 6 screens controlled by a single <OnboardingFlow /> component:

   Screen 1 — Splash
   - Centered <LogoLockup size={96} />
   - Headline: "Drinkable"
   - Sub-headline (the locked tagline, verbatim): "Personalized, conversational coffee recommendation from a knowledgeable expert."
   - Single CTA: "Get started" (sage button, rounded-full, Inter 500)

   Screen 2 — Q1: What do you usually drink?
   - Question: "What do you usually drink?"
   - Multi-select chips (user can pick any number, at least 1 required to proceed):
     V60 / Filter / Espresso / Flat white / Cortado / Latte / Cappuccino / Matcha / Tea / Other
   - Selected chips: sage background, white text. Unselected: sageLight background, ink text.
   - "Continue" button bottom, disabled until ≥1 selected.

   Screen 3 — Q2: What matters most to you?
   - Question: "What matters most when you pick a coffee shop?"
   - Multi-select chips (optional — user can skip; if they pick, at least 1):
     Discovering new independents / Certified specialty-grade / Roaster-owned / Recognized globally (top 100) / Great vibe to work in / Quick in-and-out
   - "Continue" button. "Skip" link underneath.
   - NOTE: These are PREFERENCE SIGNALS — they must be structured so the Advisor can weight them. Do NOT include items like "community discussion" or "track shops I've tried" here — those are feature-research signals captured AFTER the first recommendation (screen 6).

   Screen 4 — Location permission
   - Headline: "Where are you right now?"
   - Sub: "We'll use your location to find shops nearby. You can change this anytime."
   - Primary CTA: "Use my location" (triggers navigator.geolocation; on grant, store lat/lng in localStorage `drinkable_location_permission` = 'granted')
   - Secondary link: "Use central London instead" (falls back to 51.5074, -0.1278; stores `drinkable_location_permission` = 'denied')
   - If denied, show a small toast on the next screen: "Using central London — grant location anytime from the menu."

   Screen 5 — First recommendation (the AHA moment)
   - Headline: "Here's where you should go right now."
   - Immediately call the advisor API with the collected preferences. While loading, show an animated skeleton with the Mark01 logo pulsing gently.
   - Once the response returns, render the single top pick (first of 3 recommendations) as a big card:
     - Shop name + neighborhood
     - 2–3 sentences of reasoning from Claude
     - Distance from user
     - Price range + brew methods (as small chips)
     - Primary CTA: "Open in Google Maps" → https://www.google.com/maps/dir/?api=1&destination={lat},{lng}&destination_place_id={placeId if we have one, else omit} in a new tab
     - Secondary CTA: "See other suggestions" → scrolls or animates in 2 more cards
   - Tertiary CTA at the bottom: "Continue to Drinkable" → marks onboarding as complete and drops the user on the Advisor home screen.

   Screen 6 — Optional post-recommendation micro-survey (feature-research)
   - Show AFTER the user taps "Continue to Drinkable" on screen 5, as a non-blocking modal (they can dismiss).
   - Headline: "Quick question — help us figure out what to build next."
   - Sub: "Would any of these be useful to you?" (multi-select, optional)
     Chat with a community of coffee lovers / Track the shops I've tried / Buy beans from roasters I'll like
   - Store selections in localStorage `drinkable_feature_interest` as an array.
   - Primary CTA: "Submit" (logs the selections via console.log for now — this is telemetry we'll read manually from tester devtools).
   - Secondary link: "Skip".
   - IMPORTANT: this must NOT promise these features exist. Frame as "help us decide what to build next."

   Persist answers as they're given to localStorage key `drinkable_preferences`:
     { drinks: string[], priorities: string[], completedAt: ISO8601 }
   The onboarding is done when `drinkable_onboarded` === 'true'. If a user reloads mid-flow, resume from the last incomplete screen.

3. ADVISOR-PRIMARY HOME SCREEN
   a. Rebuild src/App.jsx's layout so the default view (post-onboarding) is an "Advisor Home" screen — NOT the map.
   b. Create src/components/AdvisorHome.jsx:
      - Top bar: <LogoLockup size={32} /> on the left, a subtle "Browse all shops" link on the right.
      - Hero question (large, Inter 500): "What are you looking for right now?"
      - Under the question, 4 quick-prompt chips the user can tap to auto-fill the input:
        "A quiet place to work nearby"
        "Best flat white within 10 min walk"
        "Try somewhere I haven't been"
        "Open right now, seat for 2"
      - Single-line text input with a send button, placeholder: "Or type anything — e.g. 'filter coffee, not too busy, outdoor seating'"
      - Below the input, a "Recent recommendations" section showing the last 3 recommendations (from localStorage `drinkable_recent_recommendations` — array of {query, topPick, timestamp}, cap at 10, newest first).
   c. Submitting the prompt POSTs to /api/advisor with {query, userLat, userLng, preferences, nearbyShops, timeOfDay}, streams the response, and renders up to 3 recommendation cards. Each card:
      - Shop name + neighborhood
      - Claude's reasoning
      - Distance
      - Chips for price + brew methods
      - Primary CTA: "Open in Google Maps" (same URL format as Screen 5)
      - Secondary CTA: "Show on map" → switches to the Browse view and flies to that shop.
   d. Preserve the existing CoffeeAdvisor.jsx logic where helpful but treat AdvisorHome as the new primary surface. The old modal-based Advisor is retired.

4. BROWSE VIEW (SECONDARY)
   a. The existing map + list + FilterBar are preserved as a secondary view at /browse (or a client-side toggle — pick whichever matches the current routing setup; if there's no router, use a view state in App.jsx).
   b. Accessed only via the "Browse all shops" link in the Advisor Home top bar, or via a rec card's "Show on map" CTA.
   c. Add a top-left back button: "← Back to Advisor".
   d. Re-skin map markers, ShopCard, FilterBar with the new palette — no structural changes.

5. ADVISOR API ENHANCEMENT
   The advisor endpoint must now accept and use user preferences.
   a. advisor-handler.js (the shared handler used by both api/advisor.js and src/server/advisor-proxy.js):
      - Accept new request fields: query (string, optional — the user's natural-language prompt), preferences ({drinks: string[], priorities: string[]}).
      - Update the system prompt to explicitly instruct Claude to weight shops that match the user's stated drink preferences and priorities. Example system-prompt addition: "The user has told us they drink: {drinks}. When they chose priorities, they picked: {priorities}. Weight your recommendations to favour shops that match these preferences — but never recommend a shop that doesn't exist in the provided list."
      - If `query` is present, pass it through as the core user request; otherwise fall back to the existing "recommend 3 shops near me" behaviour.
      - Response shape stays backwards compatible: { advice, recommendations: [{shopId, shopName, neighborhood, reasoning}] }. Add one new optional field per recommendation: `googleMapsUrl` (constructed server-side from lat/lng for convenience).
   b. Verify both api/advisor.js and src/server/advisor-proxy.js pick up the change automatically because they share the handler. If they don't, fix the sharing.

6. LOCALSTORAGE KEYS (the full set this session introduces)
   - `drinkable_onboarded`: 'true' | undefined
   - `drinkable_preferences`: JSON {drinks, priorities, completedAt}
   - `drinkable_feature_interest`: JSON string[]
   - `drinkable_location_permission`: 'granted' | 'denied'
   - `drinkable_recent_recommendations`: JSON array of {query, topPick, timestamp}, capped at 10
   Wrap reads/writes in a small src/utils/storage.js helper with try/catch so private-browsing mode doesn't blow up the app.

7. TELEMETRY (LIGHTWEIGHT)
   For every meaningful event during onboarding and advisor usage, emit a console.log with a stable tag prefix. This is deliberately crude — we'll read it from tester devtools and upgrade later.
   Events to emit:
   - [drinkable:onboarding_started]
   - [drinkable:onboarding_q1_submitted] (payload: drinks)
   - [drinkable:onboarding_q2_submitted] (payload: priorities)
   - [drinkable:location_granted] / [drinkable:location_denied]
   - [drinkable:first_recommendation_received] (payload: topPickShopId, latencyMs)
   - [drinkable:onboarding_completed]
   - [drinkable:feature_interest_submitted] (payload: selections) — or [drinkable:feature_interest_skipped]
   - [drinkable:advisor_query_submitted] (payload: query, hasPreferences)
   - [drinkable:google_maps_opened] (payload: shopId)
   - [drinkable:browse_view_opened]

8. COPY OVERHAUL
   Sweep the UI for any copy that still reflects the old positioning (map-first, generic "coffee shop finder"). Rewrite so everything points at the JTBD:
   - Empty states, loading states, error states
   - Button labels (prefer verbs: "Ask", "Open in Maps", "Show on map", "Browse all shops")
   - The old "Ask the Coffee Advisor" button in ShopCard (if still present) becomes "Why this one?" — opens a small explanation powered by the advisor, scoped to that shop.
   - Error copy stays warm and specific (e.g. "The Advisor is taking a moment. Try again?")

9. VERIFICATION
   Run locally in two terminals:
     Terminal 1: npm run server
     Terminal 2: npm run dev
   Then:
   ✓ First load (clear localStorage + hard reload): splash → Q1 → Q2 → location → first reco lands in <6s → micro-survey → Advisor home
   ✓ Second load: goes straight to Advisor home (onboarding skipped)
   ✓ Quick-prompt chips pre-fill input and can be submitted
   ✓ A free-text query returns 3 recommendations, each with a working "Open in Google Maps" link (opens in new tab with correct coordinates)
   ✓ "Show on map" switches to Browse view and selects the right shop
   ✓ Browse view renders in the new sage palette, not the old colors
   ✓ Logo mark and lockup render at all sizes used (32, 48, 96)
   ✓ No console errors; the telemetry logs fire with the expected tags
   ✓ Advisor preferences payload is visible in the /api/advisor request body (check Network tab)
   ✓ The server-side system prompt demonstrably mentions the user's drinks+priorities (log it in dev mode)
   ✓ Private-browsing mode: app still loads (storage helper doesn't throw)
   ✓ Run npm run build — succeeds with no warnings from the new code
   ✓ Lighthouse >80 across metrics on the production build

10. FILES YOU SHOULD END UP TOUCHING
   NEW:
   - src/components/Logo.jsx
   - src/components/AdvisorHome.jsx
   - src/components/onboarding/OnboardingFlow.jsx
   - src/components/onboarding/SplashScreen.jsx
   - src/components/onboarding/Q1Drinks.jsx
   - src/components/onboarding/Q2Priorities.jsx
   - src/components/onboarding/LocationPrompt.jsx
   - src/components/onboarding/FirstRecommendation.jsx
   - src/components/onboarding/FeatureInterestSurvey.jsx
   - src/utils/storage.js
   - src/utils/googleMaps.js (tiny helper that builds the directions URL)
   - src/utils/telemetry.js (wraps console.log so we can swap later)
   MODIFIED:
   - src/App.jsx (new routing between Onboarding / AdvisorHome / Browse)
   - src/components/Layout.jsx (top-bar with logo + Browse link; no more map-by-default)
   - src/components/Map.jsx, ShopCard.jsx, ShopList.jsx, FilterBar.jsx (palette re-skin only)
   - src/components/CoffeeAdvisor.jsx (either retired or reduced to the "Why this one?" micro-modal)
   - src/index.css (Inter, CSS vars for OKLCH palette)
   - tailwind.config.js (palette tokens, font family)
   - index.html (title, meta, favicon, Inter preconnect)
   - public/manifest.json (rename, colors)
   - advisor-handler.js (preferences + query + googleMapsUrl)
   - api/advisor.js, src/server/advisor-proxy.js (verify they pick up handler changes)

QUALITY STANDARDS:
- The FIRST-RUN experience — splash to "here's where you should go right now" — must feel tight (<60s including network). This is the aha moment; it's the whole point of the session.
- The Advisor home screen is intentionally minimal. Resist the urge to re-surface the map there.
- No brand references to "BrewScout" or old colours remain anywhere in the UI or meta.
- Copy points at the JTBD everywhere. If a user reads only button labels, they should understand what the app does.
- Accessibility: chips are real buttons (keyboard tabbable), the text input is labeled, focus rings are visible in the sage palette.
- The palette migration is consistent — no stray old-grey text, no mixed fonts.
- The post-recommendation micro-survey is dismissible and non-blocking; we never lock the user out for skipping it.
- Everything persists in localStorage as specified; private-browsing still works.

COMMIT:
When verification passes, commit with message:
  "Session 5: JTBD reframe — onboarding, advisor-primary UI, new design system"

Deploy to production with `vercel --prod` when Noe confirms. Do NOT deploy without confirmation.

Output the full diff summary (files created, modified, deleted) when done.
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

