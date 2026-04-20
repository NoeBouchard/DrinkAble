# DrinkAble — Deployment Guide

This guide walks you from zero to a production deployment of DrinkAble on Vercel.

---

## 1. Get the API keys

### Mapbox token (client-side, prefixed `VITE_`)
1. Go to <https://account.mapbox.com>.
2. Create a free account.
3. On the dashboard, copy the default public token (starts with `pk.`) or create a new one restricted to your domain.
4. Mapbox free tier covers ~50k map loads/month — plenty for an MVP.

### Anthropic API key (server-side only)
1. Go to <https://console.anthropic.com>.
2. Create an account and add a small credit balance ($5 is enough for hundreds of advisor calls with `claude-sonnet-4`).
3. Under **API Keys**, create a new key. Copy it immediately — it's only shown once.
4. This key is **server-only**. It must never appear in client code or `VITE_*` variables.

---

## 2. Local development

```bash
git clone git@github.com:NoeBouchard/DrinkAble.git
cd DrinkAble
npm install
cp .env.example .env.local
# then edit .env.local and paste your keys
```

`.env.local` must contain:

```
VITE_MAPBOX_TOKEN=pk.your_mapbox_token_here
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here
```

Run the two processes in separate terminals:

```bash
# Terminal 1 — Vite dev server (client)
npm run dev          # http://localhost:5173

# Terminal 2 — Express advisor proxy (Claude API)
npm run server       # http://localhost:3001
```

The client auto-detects the environment: in dev it calls `http://localhost:3001/api/advisor`; in production it calls the relative `/api/advisor` served by Vercel's serverless function.

---

## 3. Deploy to Vercel

### First-time setup

```bash
npm install -g vercel
vercel login           # opens a browser — sign in with GitHub
```

### Deploy

From the project root:

```bash
vercel                 # preview deployment
vercel --prod          # production deployment
```

Follow the prompts:
- **Link to existing project?** No (first time) — create a new one.
- **Project name:** `drinkable`.
- **Directory:** `.` (current).
- **Overrides?** No — `vercel.json` already sets framework, build command, and output directory.

### Set production environment variables

```bash
vercel env add VITE_MAPBOX_TOKEN production
# paste your pk.xxx token

vercel env add ANTHROPIC_API_KEY production
# paste your sk-ant-xxx key
```

Repeat with `preview` instead of `production` if you want them in preview deployments too.

Then redeploy so the new env vars are picked up:

```bash
vercel --prod
```

### Verify

Open the production URL (Vercel prints it after deploy). Check:
- Map tiles load (Mapbox token is wired up)
- Clicking **Ask Advisor** on a shop returns 3 AI recommendations (Anthropic key is wired up)
- No 500s in the Vercel **Logs** tab for `/api/advisor`

---

## 4. Architecture notes

- **`api/advisor.js`** is a Vercel serverless function. Vercel auto-routes `POST /api/advisor` to it. It imports `src/server/advisor-handler.js`, which holds the shared Claude-calling logic.
- **`src/server/advisor-proxy.js`** is the Express wrapper for local dev. It also calls `advisor-handler.js`, so the behavior matches production exactly.
- **`public/sw.js`** caches the app shell for offline loads. It never caches `/api/*` — advisor calls always hit the network. Bump `CACHE_VERSION` in that file when shipping an app-shell change you want clients to pick up immediately.
- **`.env.local` is gitignored**. Never commit API keys.

---

## 5. Common issues

| Symptom | Cause | Fix |
|---|---|---|
| Map area shows "Map requires a token" | `VITE_MAPBOX_TOKEN` missing or not redeployed | Add to Vercel env vars, run `vercel --prod` |
| Advisor returns "Invalid Anthropic API key" | Key typo, wrong workspace, or not redeployed | Recheck the key in the Anthropic console, `vercel env add` again, redeploy |
| Advisor returns "credit balance too low" | Anthropic account out of credits | Add credits at <https://console.anthropic.com/settings/billing> |
| Advisor returns "Cannot reach the advisor server" locally | `npm run server` not running | Start Terminal 2 with `npm run server` |
| `vercel --prod` fails with build error | Dependency missing | Confirm `@anthropic-ai/sdk` is in `dependencies` (not `devDependencies`) |

---

## 6. Post-deploy checklist

- [ ] Production URL loads on desktop and mobile
- [ ] Map renders, markers cluster, clicking a marker selects that shop in the list
- [ ] Filters work (brew method, open now, price range)
- [ ] `Ask Advisor` returns 3 recommendations within ~5s
- [ ] Lighthouse score ≥ 80 for Performance, Accessibility, Best Practices
- [ ] PWA installable ("Add to Home Screen" prompt on mobile Chrome)
